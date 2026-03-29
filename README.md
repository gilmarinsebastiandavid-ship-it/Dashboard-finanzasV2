# 💰 Dashboard de Finanzas Personales

Un dashboard completo y profesional para gestionar tus finanzas personales, conectado a PostgreSQL para almacenamiento persistente de datos.

## ✨ Características

- 📊 **Visualización de datos** - Gráficos interactivos de pastel, líneas y barras
- 💳 **Gestión de transacciones** - Registra ingresos y gastos con categorización
- 📈 **Estadísticas en tiempo real** - Balance, ingresos, gastos y tasa de ahorro
- 🎯 **Presupuestos** - Define límites de gasto por categoría
- 🗄️ **PostgreSQL** - Base de datos robusta y escalable
- 🎨 **Diseño moderno** - Interfaz atractiva con animaciones suaves
- 📱 **Responsive** - Se adapta a cualquier tamaño de pantalla

## 🛠️ Tecnologías

### Frontend
- React 18+
- Recharts (para gráficos)
- Lucide React (iconos)
- CSS moderno con gradientes y animaciones

### Backend
- Node.js
- Express
- PostgreSQL (pg driver)
- CORS

## 📋 Prerrequisitos

Asegúrate de tener instalado:

1. **Node.js** (v16 o superior)
   ```bash
   node --version
   ```

2. **PostgreSQL** (v12 o superior)
   ```bash
   psql --version
   ```

3. **npm** o **yarn**
   ```bash
   npm --version
   ```

## 🚀 Instalación

### 1. Configurar PostgreSQL

#### En Linux/Mac:
```bash
# Instalar PostgreSQL (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Iniciar el servicio
sudo service postgresql start

# Acceder a PostgreSQL
sudo -u postgres psql
```

#### En Windows:
- Descarga PostgreSQL desde: https://www.postgresql.org/download/windows/
- Ejecuta el instalador
- Durante la instalación, establece una contraseña para el usuario 'postgres'

### 2. Crear la base de datos

```bash
# Opción 1: Desde la línea de comandos
psql -U postgres -f schema.sql

# Opción 2: Desde psql interactivo
sudo -u postgres psql
\i /ruta/completa/a/schema.sql
\q
```

### 3. Instalar dependencias del backend

```bash
# En la carpeta del proyecto
npm install
```

### 4. Configurar variables de entorno

```bash
# Copia el archivo de ejemplo
cp .env.example .env

# Edita el archivo .env con tus credenciales
nano .env
```

Edita `.env` con tus datos:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finanzas_db
DB_USER=tu_usuario_postgres
DB_PASSWORD=tu_contraseña_postgres
PORT=3001
```

### 5. Iniciar el servidor backend

```bash
# Modo desarrollo (con auto-recarga)
npm run dev

# Modo producción
npm start
```

El servidor estará corriendo en `http://localhost:3001`

### 6. Configurar el frontend

El componente React (`finance-dashboard.jsx`) puede ser integrado en tu aplicación React existente o usado como artifact en Claude.

Para usar en tu proyecto React:

```bash
# En tu proyecto React
npm install recharts lucide-react

# Importa el componente
import FinanceDashboard from './finance-dashboard';
```

## 📊 Estructura de la Base de Datos

### Tablas principales:

**transacciones**
- `id` - Identificador único
- `fecha` - Fecha de la transacción
- `categoria_id` - Referencia a categoría
- `monto` - Cantidad (positiva para ingresos, negativa para gastos)
- `descripcion` - Descripción de la transacción
- `tipo` - 'ingreso' o 'gasto'

**categorias**
- `id` - Identificador único
- `nombre` - Nombre de la categoría
- `tipo` - 'ingreso' o 'gasto'
- `color` - Color en formato hexadecimal

**presupuestos**
- `id` - Identificador único
- `categoria_id` - Referencia a categoría
- `mes` - Mes del presupuesto (1-12)
- `anio` - Año del presupuesto
- `limite` - Límite de gasto

## 🔌 API Endpoints

### Transacciones

```bash
# Obtener todas las transacciones
GET /api/transacciones
Query params: ?limit=100&offset=0&tipo=gasto

# Obtener una transacción
GET /api/transacciones/:id

# Crear transacción
POST /api/transacciones
Body: {
  "fecha": "2026-01-19",
  "categoria_id": 5,
  "monto": -50.00,
  "descripcion": "Compra en supermercado",
  "tipo": "gasto"
}

# Actualizar transacción
PUT /api/transacciones/:id

# Eliminar transacción
DELETE /api/transacciones/:id
```

### Categorías

```bash
# Obtener todas las categorías
GET /api/categorias

# Crear categoría
POST /api/categorias
Body: {
  "nombre": "Nueva Categoría",
  "tipo": "gasto",
  "color": "#FF6B9D"
}
```

### Estadísticas

```bash
# Obtener estadísticas generales
GET /api/estadisticas

# Obtener tendencia (últimos 6 meses)
GET /api/estadisticas/tendencia?meses=6

# Gastos por categoría del mes actual
GET /api/estadisticas/categorias-mes
```

### Presupuestos

```bash
# Obtener presupuestos del mes
GET /api/presupuestos?mes=1&anio=2026

# Crear/actualizar presupuesto
POST /api/presupuestos
Body: {
  "categoria_id": 5,
  "mes": 1,
  "anio": 2026,
  "limite": 500.00
}
```

## 🧪 Probar la API

### Con curl:

```bash
# Test de conexión
curl http://localhost:3001/api/health

# Obtener transacciones
curl http://localhost:3001/api/transacciones

# Crear transacción
curl -X POST http://localhost:3001/api/transacciones \
  -H "Content-Type: application/json" \
  -d '{
    "fecha": "2026-01-19",
    "categoria_id": 5,
    "monto": -45.50,
    "descripcion": "Supermercado",
    "tipo": "gasto"
  }'
```

### Con Postman o Insomnia:

1. Importa la colección de endpoints
2. Configura la base URL: `http://localhost:3001`
3. Prueba cada endpoint

## 📝 Consultas SQL Útiles

```sql
-- Ver balance total
SELECT calcular_balance() AS balance_total;

-- Estadísticas del mes actual
SELECT * FROM estadisticas_mes_actual();

-- Top 5 gastos del mes
SELECT fecha, descripcion, ABS(monto) as monto, c.nombre as categoria
FROM transacciones t
JOIN categorias c ON t.categoria_id = c.id
WHERE tipo = 'gasto'
  AND EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
ORDER BY ABS(monto) DESC
LIMIT 5;

-- Gastos por categoría
SELECT * FROM gastos_por_categoria;

-- Resumen mensual
SELECT * FROM resumen_mensual;
```

## 🎨 Personalización

### Cambiar colores:

Edita los colores en el array `COLORS` en `finance-dashboard.jsx`:

```javascript
const COLORS = ['#FF6B9D', '#C44569', '#FFA502', '#FFD93D', '#6BCF7F', '#4ECDC4', '#5F27CD', '#FF6348'];
```

### Agregar nuevas categorías:

```sql
INSERT INTO categorias (nombre, tipo, color) 
VALUES ('Viajes', 'gasto', '#9B59B6');
```

### Modificar categorías predeterminadas:

Edita el archivo `schema.sql` antes de ejecutarlo.

## 🔒 Seguridad

⚠️ **IMPORTANTE**: Este es un proyecto de ejemplo. Para producción:

1. **Nunca** expongas tu base de datos directamente
2. Implementa autenticación (JWT, OAuth)
3. Valida y sanitiza todas las entradas
4. Usa HTTPS
5. Implementa rate limiting
6. Agrega logs de auditoría
7. Usa variables de entorno para secretos
8. Implementa roles y permisos

## 🐛 Solución de Problemas

### Error de conexión a PostgreSQL:

```bash
# Verifica que PostgreSQL esté corriendo
sudo service postgresql status

# Verifica las credenciales en .env
# Asegúrate de que el usuario tenga permisos
```

### Puerto 3001 en uso:

```bash
# Cambia el puerto en .env
PORT=3002

# O mata el proceso:
lsof -ti:3001 | xargs kill -9
```

### Error al crear tablas:

```bash
# Verifica que la base de datos exista
psql -U postgres -l

# Elimina y recrea si es necesario
psql -U postgres -c "DROP DATABASE IF EXISTS finanzas_db;"
psql -U postgres -f schema.sql
```

## 📚 Próximas Características

- [ ] Autenticación de usuarios
- [ ] Exportar datos a CSV/Excel
- [ ] Reportes PDF
- [ ] Notificaciones de presupuesto
- [ ] Gráficos de predicción con ML
- [ ] Importación automática desde bancos
- [ ] App móvil con React Native
- [ ] Dashboard compartido para familias

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Para contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 💡 Créditos

Desarrollado con ❤️ usando React, Node.js y PostgreSQL.

---

**¿Preguntas?** Abre un issue en GitHub o contacta al desarrollador.

**¡Disfruta gestionando tus finanzas! 💰📊**
