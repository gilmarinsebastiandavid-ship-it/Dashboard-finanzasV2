# 🐳 Guía de Docker - Dashboard Financiero

Configuración completa de Docker con Docker Compose para ejecutar el proyecto completo (Frontend, Backend y PostgreSQL) en contenedores.

## 📋 Requisitos Previos

- Docker Desktop (Windows/Mac) o Docker Engine (Linux)
- Docker Compose (incluido en Docker Desktop)

### Instalación de Docker

**Windows/Mac:**
- Descargar [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Instalar y reiniciar

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose
```

Verificar instalación:
```bash
docker --version
docker-compose --version
```

## 🚀 Inicio Rápido

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/dashboard-financiero.git
cd dashboard-financiero
```

### 2. Estructura de archivos Docker

Asegúrate de tener esta estructura:

```
dashboard-financiero/
├── docker-compose.yml           # Orquestación de contenedores
├── .env                          # Variables de entorno (copiar desde .env.docker)
├── backend/
│   ├── Dockerfile               # Imagen del backend
│   ├── .dockerignore
│   ├── server.js
│   ├── schema.sql
│   └── package.json
└── frontend/
    ├── Dockerfile               # Imagen del frontend
    ├── .dockerignore
    ├── nginx.conf               # Configuración de nginx
    ├── src/
    └── package.json
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo:
```bash
cp .env.docker .env
```

Edita `.env` si necesitas cambiar puertos o contraseñas:
```env
DB_PASSWORD=postgres123
FRONTEND_PORT=8000
BACKEND_PORT=3001
POSTGRES_PORT=5432
REACT_APP_API_URL=http://localhost:3001/api
```

### 4. Construir y ejecutar

```bash
# Construir las imágenes y levantar los contenedores
docker-compose up --build

# O en segundo plano (detached mode)
docker-compose up --build -d
```

**Tiempo estimado:** 3-5 minutos la primera vez

### 5. Acceder a la aplicación

- **Frontend:** http://localhost:8000
- **Backend API:** http://localhost:3001/api/health
- **PostgreSQL:** localhost:5432

## 🎯 Comandos Útiles

### Ver logs en tiempo real

```bash
# Todos los servicios
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo frontend
docker-compose logs -f frontend

# Solo base de datos
docker-compose logs -f postgres
```

### Detener los contenedores

```bash
# Detener sin eliminar
docker-compose stop

# Detener y eliminar contenedores (los datos persisten)
docker-compose down

# Detener y eliminar TODO (incluye volúmenes de datos)
docker-compose down -v
```

### Reiniciar un servicio específico

```bash
docker-compose restart backend
docker-compose restart frontend
docker-compose restart postgres
```

### Ver estado de los contenedores

```bash
docker-compose ps
```

### Reconstruir una imagen específica

```bash
# Reconstruir solo el backend
docker-compose build backend

# Reconstruir solo el frontend
docker-compose build frontend
```

### Ejecutar comandos dentro de un contenedor

```bash
# Acceder a bash del backend
docker-compose exec backend sh

# Acceder a PostgreSQL
docker-compose exec postgres psql -U postgres -d finanzas_db

# Ver logs del backend
docker-compose exec backend cat /app/logs/app.log
```

## 🔧 Desarrollo con Docker

### Modo desarrollo con hot-reload

Para desarrollo, puedes usar volúmenes para sincronizar el código:

Crea `docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      NODE_ENV: development
    command: npm run dev

  frontend:
    build: ./frontend
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      NODE_ENV: development
    command: npm start
```

Ejecutar:
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## 📊 Gestión de la Base de Datos

### Backup de la base de datos

```bash
# Crear backup
docker-compose exec postgres pg_dump -U postgres finanzas_db > backup.sql

# O con fecha
docker-compose exec postgres pg_dump -U postgres finanzas_db > backup_$(date +%Y%m%d).sql
```

### Restaurar base de datos

```bash
# Método 1: Desde archivo
docker-compose exec -T postgres psql -U postgres finanzas_db < backup.sql

# Método 2: Copiar archivo al contenedor
docker cp backup.sql finanzas_db:/backup.sql
docker-compose exec postgres psql -U postgres finanzas_db -f /backup.sql
```

### Ejecutar SQL directamente

```bash
docker-compose exec postgres psql -U postgres -d finanzas_db -c "SELECT * FROM transacciones LIMIT 5;"
```

### Reiniciar base de datos

```bash
# Detener y eliminar volumen
docker-compose down -v

# Volver a levantar (creará BD desde schema.sql)
docker-compose up -d
```

## 🌐 Acceso desde Otros Dispositivos

### Configuración para red local

1. **Obtener tu IP local:**
   ```bash
   # Windows
   ipconfig
   
   # Linux/Mac
   ifconfig | grep "inet "
   ```

2. **Actualizar `.env`:**
   ```env
   REACT_APP_API_URL=http://192.168.1.100:3001/api
   ```

3. **Reconstruir frontend:**
   ```bash
   docker-compose up --build frontend
   ```

4. **Acceder desde dispositivo móvil:**
   ```
   http://192.168.1.100:8000
   ```

## 🚀 Despliegue en Producción

### Docker Hub (opcional)

```bash
# Login
docker login

# Tag de imágenes
docker tag dashboard-financiero_backend tu-usuario/finanzas-backend:latest
docker tag dashboard-financiero_frontend tu-usuario/finanzas-frontend:latest

# Push
docker push tu-usuario/finanzas-backend:latest
docker push tu-usuario/finanzas-frontend:latest
```

### Servidor VPS (AWS, DigitalOcean, etc.)

```bash
# En el servidor
git clone https://github.com/tu-usuario/dashboard-financiero.git
cd dashboard-financiero

# Configurar .env
cp .env.docker .env
nano .env  # Editar valores

# Levantar en producción
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### Usar dominio propio

Actualizar `.env`:
```env
REACT_APP_API_URL=https://api.tu-dominio.com/api
```

Configurar nginx reverse proxy o usar Traefik.

## 🐛 Solución de Problemas

### Error: "Cannot connect to the Docker daemon"

**Windows/Mac:**
- Abrir Docker Desktop
- Esperar a que inicie completamente

**Linux:**
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### Error: "port is already allocated"

Cambiar puertos en `.env`:
```env
FRONTEND_PORT=3000
BACKEND_PORT=4000
POSTGRES_PORT=5433
```

### El frontend no conecta con el backend

1. Verificar que el backend esté corriendo:
   ```bash
   curl http://localhost:3001/api/health
   ```

2. Verificar REACT_APP_API_URL en `.env`

3. Reconstruir frontend:
   ```bash
   docker-compose up --build frontend
   ```

### PostgreSQL no inicia

```bash
# Ver logs
docker-compose logs postgres

# Eliminar volumen corrupto y reiniciar
docker-compose down -v
docker-compose up -d
```

### Limpiar todo y empezar de cero

```bash
# Detener todo
docker-compose down -v

# Eliminar imágenes
docker rmi dashboard-financiero_backend dashboard-financiero_frontend

# Limpiar sistema Docker (cuidado: elimina TODOS los recursos no usados)
docker system prune -a

# Volver a construir
docker-compose up --build
```

## 📊 Monitoreo y Performance

### Ver uso de recursos

```bash
# Uso en tiempo real
docker stats

# Uso de un contenedor específico
docker stats finanzas_backend
```

### Ver tamaño de imágenes

```bash
docker images
```

### Optimizar tamaño de imágenes

Las imágenes ya están optimizadas usando:
- Alpine Linux (imagen base mínima)
- Multi-stage builds (frontend)
- .dockerignore para excluir archivos innecesarios

## 🔒 Seguridad

### Cambiar contraseñas en producción

```env
DB_PASSWORD=contraseña_super_segura_y_larga_123!
```

### No exponer PostgreSQL en producción

En `docker-compose.yml`, comentar:
```yaml
# ports:
#   - "5432:5432"
```

### Variables de entorno sensibles

Usar Docker secrets o servicios como AWS Secrets Manager.

## 📚 Recursos Adicionales

- [Documentación de Docker](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Best Practices](https://docs.docker.com/develop/dev-best-practices/)

## 🆘 Soporte

Si tienes problemas:

1. Revisar logs: `docker-compose logs -f`
2. Verificar estado: `docker-compose ps`
3. Buscar en [Issues del repositorio](https://github.com/tu-usuario/dashboard-financiero/issues)
4. Crear un nuevo Issue con detalles

---

**¡Feliz Dockerización! 🐳**
