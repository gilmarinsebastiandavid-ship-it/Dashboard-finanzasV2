// Backend API para Dashboard de Finanzas
// Node.js + Express + PostgreSQL

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*',  // Permite conexiones desde cualquier origen
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(bodyParser.json());

// Configuración de PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'finanzas_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Baticueva0827',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Verificar conexión a la base de datos
pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error en la conexión a PostgreSQL:', err);
});

// ==================== RUTAS ====================

// Test de conexión
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      success: true,
      message: 'Base de datos conectada correctamente',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al conectar con la base de datos',
      error: error.message
    });
  }
});

// ==================== TRANSACCIONES ====================

// Obtener todas las transacciones
app.get('/api/transacciones', async (req, res) => {
  try {
    const { limit = 100, offset = 0, tipo, categoria_id } = req.query;
    
    let query = `
      SELECT t.*, c.nombre as categoria_nombre, c.color as categoria_color
      FROM transacciones t
      LEFT JOIN categorias c ON t.categoria_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (tipo) {
      query += ` AND t.tipo = $${paramCount}`;
      params.push(tipo);
      paramCount++;
    }

    if (categoria_id) {
      query += ` AND t.categoria_id = $${paramCount}`;
      params.push(categoria_id);
      paramCount++;
    }

    query += ` ORDER BY t.fecha DESC, t.id DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount
    });
  } catch (error) {
    console.error('Error obteniendo transacciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener transacciones',
      error: error.message
    });
  }
});

// Obtener una transacción por ID
app.get('/api/transacciones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT t.*, c.nombre as categoria_nombre FROM transacciones t LEFT JOIN categorias c ON t.categoria_id = c.id WHERE t.id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error obteniendo transacción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener transacción',
      error: error.message
    });
  }
});

// Crear nueva transacción
app.post('/api/transacciones', async (req, res) => {
  try {
    const { fecha, categoria_id, monto, descripcion, tipo, cuenta, etiquetas, notas } = req.body;

    // Validaciones
    if (!fecha || !monto || !tipo) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: fecha, monto, tipo'
      });
    }

    if (!['ingreso', 'gasto'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: 'El tipo debe ser "ingreso" o "gasto"'
      });
    }

    const result = await pool.query(
      `INSERT INTO transacciones (fecha, categoria_id, monto, descripcion, tipo, cuenta, etiquetas, notas)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [fecha, categoria_id, monto, descripcion, tipo, cuenta || 'Principal', etiquetas, notas]
    );

    res.status(201).json({
      success: true,
      message: 'Transacción creada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creando transacción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear transacción',
      error: error.message
    });
  }
});

// Actualizar transacción
app.put('/api/transacciones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, categoria_id, monto, descripcion, tipo, cuenta, etiquetas, notas } = req.body;

    const result = await pool.query(
      `UPDATE transacciones 
       SET fecha = COALESCE($1, fecha),
           categoria_id = COALESCE($2, categoria_id),
           monto = COALESCE($3, monto),
           descripcion = COALESCE($4, descripcion),
           tipo = COALESCE($5, tipo),
           cuenta = COALESCE($6, cuenta),
           etiquetas = COALESCE($7, etiquetas),
           notas = COALESCE($8, notas)
       WHERE id = $9
       RETURNING *`,
      [fecha, categoria_id, monto, descripcion, tipo, cuenta, etiquetas, notas, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Transacción actualizada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error actualizando transacción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar transacción',
      error: error.message
    });
  }
});

// Eliminar transacción
app.delete('/api/transacciones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM transacciones WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Transacción eliminada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error eliminando transacción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar transacción',
      error: error.message
    });
  }
});

// ==================== CATEGORÍAS ====================

// Obtener todas las categorías
app.get('/api/categorias', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categorias ORDER BY nombre');
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías',
      error: error.message
    });
  }
});

// Crear categoría
app.post('/api/categorias', async (req, res) => {
  try {
    const { nombre, tipo, color, icono } = req.body;

    if (!nombre || !tipo) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: nombre, tipo'
      });
    }

    const result = await pool.query(
      'INSERT INTO categorias (nombre, tipo, color, icono) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, tipo, color || '#FF6B9D', icono]
    );

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creando categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear categoría',
      error: error.message
    });
  }
});

// ==================== ESTADÍSTICAS ====================

// Obtener estadísticas generales
app.get('/api/estadisticas', async (req, res) => {
  try {
    const balanceQuery = await pool.query('SELECT calcular_balance() as balance');
    const statsQuery = await pool.query('SELECT * FROM estadisticas_mes_actual()');
    const categoriesQuery = await pool.query('SELECT * FROM gastos_por_categoria');

    res.json({
      success: true,
      data: {
        balance_total: balanceQuery.rows[0].balance,
        mes_actual: statsQuery.rows[0],
        gastos_por_categoria: categoriesQuery.rows
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
});

// Obtener tendencia de gastos/ingresos
app.get('/api/estadisticas/tendencia', async (req, res) => {
  try {
    const { meses = 6 } = req.query;
    
    const result = await pool.query(`
      SELECT 
        TO_CHAR(fecha, 'YYYY-MM') AS mes,
        TO_CHAR(fecha, 'Mon YYYY') AS mes_nombre,
        SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) AS ingresos,
        SUM(CASE WHEN tipo = 'gasto' THEN ABS(monto) ELSE 0 END) AS gastos
      FROM transacciones
      WHERE fecha >= CURRENT_DATE - INTERVAL '${parseInt(meses)} months'
      GROUP BY TO_CHAR(fecha, 'YYYY-MM'), TO_CHAR(fecha, 'Mon YYYY')
      ORDER BY mes
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo tendencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tendencia',
      error: error.message
    });
  }
});

// Obtener gastos por categoría del mes actual
app.get('/api/estadisticas/categorias-mes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.nombre,
        c.color,
        SUM(ABS(t.monto)) as total
      FROM transacciones t
      JOIN categorias c ON t.categoria_id = c.id
      WHERE t.tipo = 'gasto'
        AND EXTRACT(MONTH FROM t.fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM t.fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
      GROUP BY c.id, c.nombre, c.color
      ORDER BY total DESC
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo gastos por categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener gastos por categoría',
      error: error.message
    });
  }
});

// ==================== PRESUPUESTOS ====================

// Obtener presupuestos
app.get('/api/presupuestos', async (req, res) => {
  try {
    const { mes, anio } = req.query;
    const currentMonth = mes || new Date().getMonth() + 1;
    const currentYear = anio || new Date().getFullYear();

    const result = await pool.query(`
      SELECT p.*, c.nombre as categoria_nombre,
             COALESCE((
               SELECT SUM(ABS(monto))
               FROM transacciones t
               WHERE t.categoria_id = p.categoria_id
                 AND EXTRACT(MONTH FROM t.fecha) = p.mes
                 AND EXTRACT(YEAR FROM t.fecha) = p.anio
                 AND t.tipo = 'gasto'
             ), 0) as gastado
      FROM presupuestos p
      JOIN categorias c ON p.categoria_id = c.id
      WHERE p.mes = $1 AND p.anio = $2
    `, [currentMonth, currentYear]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo presupuestos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener presupuestos',
      error: error.message
    });
  }
});

// Crear presupuesto
app.post('/api/presupuestos', async (req, res) => {
  try {
    const { categoria_id, mes, anio, limite, alertas } = req.body;

    if (!categoria_id || !mes || !anio || !limite) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos'
      });
    }

    const result = await pool.query(
      `INSERT INTO presupuestos (categoria_id, mes, anio, limite, alertas)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (categoria_id, mes, anio)
       DO UPDATE SET limite = $4, alertas = $5
       RETURNING *`,
      [categoria_id, mes, anio, limite, alertas !== false]
    );

    res.status(201).json({
      success: true,
      message: 'Presupuesto creado/actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creando presupuesto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear presupuesto',
      error: error.message
    });
  }
});

// Eliminar presupuesto
app.delete('/api/presupuestos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM presupuestos WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Presupuesto no encontrado' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Actualizar presupuesto
app.put('/api/presupuestos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { limite, alertas } = req.body;
    
    const result = await pool.query(
      `UPDATE presupuestos SET limite = COALESCE($1, limite), alertas = COALESCE($2, alertas)
       WHERE id = $3 RETURNING *`,
      [limite, alertas, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Presupuesto no encontrado' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// Obtener todas las metas
app.get('/api/metas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM metas_ahorro ORDER BY id');
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo metas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener metas',
      error: error.message
    });
  }
});

// Crear meta
app.post('/api/metas', async (req, res) => {
  try {
    const { nombre, monto_objetivo, monto_actual, fecha_limite, descripcion } = req.body;

    const result = await pool.query(
      `INSERT INTO metas_ahorro (nombre, monto_objetivo, monto_actual, fecha_inicio, fecha_limite, descripcion)
       VALUES ($1, $2, $3, CURRENT_DATE, $4, $5)
       RETURNING *`,
      [nombre, monto_objetivo, monto_actual || 0, fecha_limite, descripcion]
    );

    res.status(201).json({
      success: true,
      message: 'Meta creada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creando meta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear meta',
      error: error.message
    });
  }
});

// Actualizar monto de meta
app.put('/api/metas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { monto_actual, completada } = req.body;

    const result = await pool.query(
      `UPDATE metas_ahorro 
       SET monto_actual = COALESCE($1, monto_actual),
           completada = COALESCE($2, completada)
       WHERE id = $3
       RETURNING *`,
      [monto_actual, completada, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Meta no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Meta actualizada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error actualizando meta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar meta',
      error: error.message
    });
  }
});

// Eliminar meta
app.delete('/api/metas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM metas_ahorro WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Meta no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Meta eliminada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error eliminando meta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar meta',
      error: error.message
    });
  }
});
// ==================== INICIAR SERVIDOR ====================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🚀 Servidor de API de Finanzas                      ║
║                                                        ║
║   📡 Puerto: ${PORT}                                      ║
║   🗄️  Base de datos: PostgreSQL                       ║
║   ✅ Estado: Activo                                    ║
║                                                        ║
║   Endpoints disponibles:                              ║
║   - GET    /api/health                                ║
║   - GET    /api/transacciones                         ║
║   - POST   /api/transacciones                         ║
║   - GET    /api/categorias                            ║
║   - GET    /api/estadisticas                          ║
║   - GET    /api/presupuestos                          ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ Error no manejado:', err);
});

module.exports = app;
