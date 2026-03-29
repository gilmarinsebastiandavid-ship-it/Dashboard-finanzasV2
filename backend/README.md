# 💰 Dashboard Financiero - Backend API

API REST desarrollada con Node.js, Express y PostgreSQL para gestionar finanzas personales.

## 🚀 Características

- ✅ API RESTful completa con Express
- ✅ Base de datos PostgreSQL
- ✅ CRUD de transacciones, categorías, metas y presupuestos
- ✅ Autenticación CORS configurada
- ✅ Manejo de errores robusto
- ✅ Vistas y funciones SQL optimizadas

## 📋 Requisitos Previos

- Node.js 14.x o superior
- PostgreSQL 12.x o superior
- npm o yarn

## 🛠️ Instalación

Tienes **dos opciones**:

### 🐳 Opción 1: Con Docker (Recomendado)

**Requisitos:**
- Docker y Docker Compose

```bash
# Desde la raíz del proyecto
docker-compose up backend postgres -d

# Ver logs
docker-compose logs -f backend

# El backend estará en: http://localhost:3001
```

📖 Ver [DOCKER_GUIDE.md](../DOCKER_GUIDE.md) para más detalles.

---

### 💻 Opción 2: Instalación Manual

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/dashboard-financiero.git
cd dashboard-financiero/backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar PostgreSQL

#### Opción A: Línea de comandos

```bash
# Conectarse a PostgreSQL
psql -U postgres

# Crear la base de datos
CREATE DATABASE finanzas_db;

# Salir
\q

# Ejecutar el schema
psql -U postgres -d finanzas_db -f schema.sql
```

#### Opción B: pgAdmin

1. Abrir pgAdmin
2. Click derecho en "Databases" → Create → Database
3. Nombre: `finanzas_db`
4. Abrir Query Tool
5. Abrir y ejecutar el archivo `schema.sql`

### 4. Configurar variables de entorno

Crea un archivo `.env` en la raíz del backend:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finanzas_db
DB_USER=postgres
DB_PASSWORD=tu_contraseña_aqui
PORT=3001
```

## 🚀 Ejecutar el Servidor

### 🐳 Con Docker (Recomendado)

**La forma más fácil de ejecutar el backend:**

```bash
# Desde la raíz del proyecto
docker-compose up -d backend postgres

# Ver logs
docker-compose logs -f backend

# El servidor estará en: http://localhost:3001
```

**Verificar que funciona:**
```bash
curl http://localhost:3001/api/health
# o
make test-api
```

**Comandos útiles:**
```bash
# Reiniciar backend
docker-compose restart backend

# Ver logs
docker-compose logs -f backend

# Acceder a shell del backend
docker-compose exec backend sh

# Reconstruir imagen
docker-compose build backend
docker-compose up -d backend
```

---

### 💻 Desarrollo (Sin Docker)

```bash
npm start
```

El servidor estará disponible en: `http://localhost:3001`

### Verificar que funciona

Abre en el navegador:
```
http://localhost:3001/api/health
```

Deberías ver:
```json
{
  "success": true,
  "message": "Base de datos conectada correctamente"
}
```

## 📡 Endpoints de la API

### Transacciones

```
GET    /api/transacciones          - Listar todas las transacciones
GET    /api/transacciones/:id      - Obtener una transacción
POST   /api/transacciones          - Crear transacción
PUT    /api/transacciones/:id      - Actualizar transacción
DELETE /api/transacciones/:id      - Eliminar transacción
```

### Categorías

```
GET    /api/categorias             - Listar todas las categorías
GET    /api/categorias/:id         - Obtener una categoría
```

### Metas de Ahorro

```
GET    /api/metas                  - Listar todas las metas
GET    /api/metas/:id              - Obtener una meta
POST   /api/metas                  - Crear meta
PUT    /api/metas/:id              - Actualizar meta
DELETE /api/metas/:id              - Eliminar meta
```

### Presupuestos

```
GET    /api/presupuestos           - Listar todos los presupuestos
GET    /api/presupuestos/:id       - Obtener un presupuesto
POST   /api/presupuestos           - Crear presupuesto
PUT    /api/presupuestos/:id       - Actualizar presupuesto
DELETE /api/presupuestos/:id       - Eliminar presupuesto
```

### Estadísticas

```
GET    /api/estadisticas           - Obtener estadísticas generales
GET    /api/estadisticas/mes       - Estadísticas del mes actual
```

## 📝 Ejemplo de Uso

### Crear una transacción

```bash
curl -X POST http://localhost:3001/api/transacciones \
  -H "Content-Type: application/json" \
  -d '{
    "fecha": "2026-01-21",
    "categoria_id": 5,
    "monto": -50000,
    "descripcion": "Supermercado",
    "tipo": "gasto",
    "cuenta": "Principal"
  }'
```

### Obtener todas las transacciones

```bash
curl http://localhost:3001/api/transacciones
```

## 🐳 Docker

### Dockerfile

El backend incluye un `Dockerfile` optimizado con Node.js Alpine:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

**Características:**
- ✅ Imagen base ligera (Alpine Linux)
- ✅ Instalación de dependencias optimizada
- ✅ Tamaño reducido (~150MB)
- ✅ Producción ready

### Construcción Manual de Imagen

```bash
# Construir imagen
docker build -t finanzas-backend .

# Ejecutar contenedor standalone
docker run -p 3001:3001 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=5432 \
  -e DB_NAME=finanzas_db \
  -e DB_USER=postgres \
  -e DB_PASSWORD=tu_password \
  finanzas-backend
```

### Con docker-compose (Recomendado)

```bash
# Levantar backend y PostgreSQL
docker-compose up -d backend postgres

# Ver logs en tiempo real
docker-compose logs -f backend

# Reiniciar backend
docker-compose restart backend

# Detener servicios
docker-compose down
```

### Variables de Entorno en Docker

```yaml
# En docker-compose.yml
environment:
  DB_HOST: postgres          # Nombre del servicio PostgreSQL
  DB_PORT: 5432
  DB_NAME: finanzas_db
  DB_USER: postgres
  DB_PASSWORD: ${DB_PASSWORD}
  PORT: 3001
  NODE_ENV: production
```

### Debugging en Docker

```bash
# Ver logs
docker-compose logs -f backend

# Acceder al shell del contenedor
docker-compose exec backend sh

# Verificar variables de entorno
docker-compose exec backend env

# Reiniciar solo el backend
docker-compose restart backend
```

## 🗄️ Estructura de la Base de Datos

### Tablas principales:

- `transacciones` - Registro de ingresos y gastos
- `categorias` - Categorías de transacciones
- `metas_ahorro` - Metas de ahorro personales
- `presupuestos` - Límites de gasto por categoría
- `cuentas` - Cuentas bancarias

### Vistas:

- `resumen_mensual` - Resumen de ingresos/gastos por mes
- `gastos_por_categoria` - Totales agrupados por categoría

### Funciones:

- `calcular_balance()` - Calcula el balance total
- `estadisticas_mes_actual()` - Genera estadísticas del mes

## 🔧 Configuración Adicional

### Permitir conexiones remotas (opcional)

Si necesitas acceder desde otro dispositivo:

1. Editar `server.js` - Cambiar `app.listen`:
```javascript
app.listen(PORT, '0.0.0.0', () => {
  // ...
});
```

2. Configurar firewall (Windows):
```bash
netsh advfirewall firewall add rule name="Backend API" dir=in action=allow protocol=TCP localport=3001
```

3. Actualizar CORS en `server.js`:
```javascript
app.use(cors({
  origin: '*', // O especifica las IPs permitidas
  credentials: true
}));
```

## 🐛 Solución de Problemas

### Error: "connect ECONNREFUSED"

**Causa:** PostgreSQL no está corriendo

**Solución:**
```bash
# Windows
services.msc → PostgreSQL → Iniciar

# Linux
sudo systemctl start postgresql

# Mac
brew services start postgresql
```

### Error: "password authentication failed"

**Causa:** Contraseña incorrecta en `.env`

**Solución:**
1. Verificar contraseña en `.env`
2. Resetear si es necesario:
```sql
ALTER USER postgres PASSWORD 'nueva_contraseña';
```

### Error: "relation does not exist"

**Causa:** Schema no ejecutado

**Solución:**
```bash
psql -U postgres -d finanzas_db -f schema.sql
```

## 📦 Dependencias Principales

```json
{
  "express": "^4.18.2",
  "pg": "^8.11.3",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1"
}
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👤 Autor

Tu Nombre - [@tu_usuario](https://github.com/tu-usuario)

## 🙏 Agradecimientos

- [Express](https://expressjs.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [Node.js](https://nodejs.org/)

---

⭐ Si este proyecto te fue útil, dale una estrella en GitHub!
