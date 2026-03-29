-- ====================================
-- DASHBOARD FINANCIERO - SCHEMA SQL
-- Base de datos PostgreSQL
-- ====================================

-- Eliminar tablas si existen (en orden correcto por dependencias)
DROP TABLE IF EXISTS asignaciones_metas CASCADE;
DROP TABLE IF EXISTS presupuestos CASCADE;
DROP TABLE IF EXISTS metas_ahorro CASCADE;
DROP TABLE IF EXISTS transacciones CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS cuentas CASCADE;

-- ====================================
-- TABLA: cuentas
-- ====================================
CREATE TABLE cuentas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    saldo DECIMAL(15, 2) DEFAULT 0,
    moneda VARCHAR(10) DEFAULT 'COP',
    activa BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- TABLA: categorias
-- ====================================
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
    color VARCHAR(20) DEFAULT '#FF6B9D',
    icono VARCHAR(50),
    descripcion TEXT,
    activa BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- TABLA: transacciones
-- ====================================
CREATE TABLE transacciones (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
    monto DECIMAL(15, 2) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
    cuenta VARCHAR(100) DEFAULT 'Principal',
    etiquetas TEXT[],
    notas TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- TABLA: metas_ahorro
-- ====================================
CREATE TABLE metas_ahorro (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    monto_objetivo DECIMAL(15, 2) NOT NULL,
    monto_actual DECIMAL(15, 2) DEFAULT 0,
    fecha_limite DATE,
    completada BOOLEAN DEFAULT false,
    prioridad INTEGER DEFAULT 1,
    color VARCHAR(20) DEFAULT '#FFD93D',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_completado TIMESTAMP
);

-- ====================================
-- TABLA: presupuestos
-- ====================================
CREATE TABLE presupuestos (
    id SERIAL PRIMARY KEY,
    categoria_id INTEGER REFERENCES categorias(id) ON DELETE CASCADE,
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    anio INTEGER NOT NULL,
    limite DECIMAL(15, 2) NOT NULL,
    gastado DECIMAL(15, 2) DEFAULT 0,
    alertas BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(categoria_id, mes, anio)
);

-- ====================================
-- TABLA: asignaciones_metas
-- ====================================
CREATE TABLE asignaciones_metas (
    id SERIAL PRIMARY KEY,
    meta_id INTEGER REFERENCES metas_ahorro(id) ON DELETE CASCADE,
    monto DECIMAL(15, 2) NOT NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- INSERTAR DATOS INICIALES
-- ====================================

-- Insertar cuenta por defecto
INSERT INTO cuentas (nombre, tipo, saldo) VALUES
('Principal', 'Efectivo', 0);

-- Insertar categorías de INGRESOS
INSERT INTO categorias (nombre, tipo, color, icono) VALUES
('Salario', 'ingreso', '#4ECDC4', '💰'),
('Freelance', 'ingreso', '#6BCF7F', '💼'),
('Inversiones', 'ingreso', '#5F27CD', '📈'),
('Bonos', 'ingreso', '#FFD93D', '🎁'),
('Otros Ingresos', 'ingreso', '#95A5A6', '💵');

-- Insertar categorías de GASTOS
INSERT INTO categorias (nombre, tipo, color, icono) VALUES
('Alimentación', 'gasto', '#FF6B9D', '🍔'),
('Transporte', 'gasto', '#FFA502', '🚗'),
('Vivienda', 'gasto', '#C44569', '🏠'),
('Servicios', 'gasto', '#4ECDC4', '💡'),
('Entretenimiento', 'gasto', '#5F27CD', '🎮'),
('Salud', 'gasto', '#FF6348', '⚕️'),
('Educación', 'gasto', '#1E90FF', '📚'),
('Ropa', 'gasto', '#E84393', '👔'),
('Tecnología', 'gasto', '#6C5CE7', '💻'),
('Otros Gastos', 'gasto', '#95A5A6', '🛒');

-- ====================================
-- VISTAS
-- ====================================

-- Vista: Resumen mensual
CREATE OR REPLACE VIEW resumen_mensual AS
SELECT 
    EXTRACT(YEAR FROM fecha) AS anio,
    EXTRACT(MONTH FROM fecha) AS mes,
    SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) AS total_ingresos,
    SUM(CASE WHEN tipo = 'gasto' THEN ABS(monto) ELSE 0 END) AS total_gastos,
    SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE -ABS(monto) END) AS balance
FROM transacciones
GROUP BY anio, mes
ORDER BY anio DESC, mes DESC;

-- Vista: Gastos por categoría
CREATE OR REPLACE VIEW gastos_por_categoria AS
SELECT 
    c.nombre AS categoria,
    c.color,
    COUNT(t.id) AS cantidad_transacciones,
    SUM(ABS(t.monto)) AS total_gastado
FROM transacciones t
JOIN categorias c ON t.categoria_id = c.id
WHERE t.tipo = 'gasto'
GROUP BY c.nombre, c.color
ORDER BY total_gastado DESC;

-- Vista: Transacciones con nombre de categoría
CREATE OR REPLACE VIEW transacciones_detalle AS
SELECT 
    t.id,
    t.fecha,
    t.categoria_id,
    c.nombre AS categoria_nombre,
    c.color AS categoria_color,
    c.icono AS categoria_icono,
    t.monto,
    t.descripcion,
    t.tipo,
    t.cuenta,
    t.fecha_creacion
FROM transacciones t
LEFT JOIN categorias c ON t.categoria_id = c.id
ORDER BY t.fecha DESC, t.id DESC;

-- ====================================
-- FUNCIONES
-- ====================================

-- Función: Calcular balance total
CREATE OR REPLACE FUNCTION calcular_balance()
RETURNS DECIMAL(15, 2) AS $$
DECLARE
    balance DECIMAL(15, 2);
BEGIN
    SELECT 
        COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE -ABS(monto) END), 0)
    INTO balance
    FROM transacciones;
    
    RETURN balance;
END;
$$ LANGUAGE plpgsql;

-- Función: Actualizar monto gastado en presupuestos
CREATE OR REPLACE FUNCTION actualizar_presupuesto()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar presupuesto del mes correspondiente
    UPDATE presupuestos
    SET gastado = (
        SELECT COALESCE(SUM(ABS(monto)), 0)
        FROM transacciones
        WHERE categoria_id = presupuestos.categoria_id
          AND tipo = 'gasto'
          AND EXTRACT(MONTH FROM fecha) = presupuestos.mes
          AND EXTRACT(YEAR FROM fecha) = presupuestos.anio
    )
    WHERE categoria_id = NEW.categoria_id
      AND mes = EXTRACT(MONTH FROM NEW.fecha)
      AND anio = EXTRACT(YEAR FROM NEW.fecha);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función: Estadísticas del mes actual
CREATE OR REPLACE FUNCTION estadisticas_mes_actual()
RETURNS TABLE (
    total_ingresos DECIMAL(15, 2),
    total_gastos DECIMAL(15, 2),
    balance DECIMAL(15, 2),
    cantidad_transacciones BIGINT,
    tasa_ahorro DECIMAL(5, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END), 0) AS total_ingresos,
        COALESCE(SUM(CASE WHEN tipo = 'gasto' THEN ABS(monto) ELSE 0 END), 0) AS total_gastos,
        COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE -ABS(monto) END), 0) AS balance,
        COUNT(*) AS cantidad_transacciones,
        CASE 
            WHEN SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) > 0 THEN
                ROUND((SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE -ABS(monto) END) / 
                       SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) * 100)::NUMERIC, 2)
            ELSE 0
        END AS tasa_ahorro
    FROM transacciones
    WHERE EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- TRIGGERS
-- ====================================

-- Trigger: Actualizar presupuesto cuando se crea/modifica transacción
CREATE TRIGGER trigger_actualizar_presupuesto
AFTER INSERT OR UPDATE ON transacciones
FOR EACH ROW
WHEN (NEW.tipo = 'gasto')
EXECUTE FUNCTION actualizar_presupuesto();

-- Trigger: Actualizar fecha de modificación
CREATE OR REPLACE FUNCTION actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_fecha_transaccion
BEFORE UPDATE ON transacciones
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_modificacion();

-- ====================================
-- ÍNDICES PARA MEJOR RENDIMIENTO
-- ====================================

CREATE INDEX idx_transacciones_fecha ON transacciones(fecha DESC);
CREATE INDEX idx_transacciones_categoria ON transacciones(categoria_id);
CREATE INDEX idx_transacciones_tipo ON transacciones(tipo);
CREATE INDEX idx_presupuestos_mes_anio ON presupuestos(mes, anio);
CREATE INDEX idx_categorias_tipo ON categorias(tipo);

-- ====================================
-- COMENTARIOS EN TABLAS
-- ====================================

COMMENT ON TABLE transacciones IS 'Registro de todas las transacciones financieras';
COMMENT ON TABLE categorias IS 'Categorías para clasificar ingresos y gastos';
COMMENT ON TABLE metas_ahorro IS 'Metas de ahorro personales';
COMMENT ON TABLE presupuestos IS 'Límites de gasto mensuales por categoría';
COMMENT ON TABLE cuentas IS 'Cuentas bancarias y de efectivo';

-- ====================================
-- FIN DEL SCHEMA
-- ====================================

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Schema de Dashboard Financiero creado exitosamente';
    RAISE NOTICE 'Categorías insertadas: %', (SELECT COUNT(*) FROM categorias);
    RAISE NOTICE 'Base de datos lista para usar';
END $$;
