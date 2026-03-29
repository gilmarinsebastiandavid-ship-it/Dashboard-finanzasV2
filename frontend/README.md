# 💰 Dashboard Financiero - Frontend

Interfaz web moderna desarrollada con React para gestionar finanzas personales con visualizaciones interactivas.

## ✨ Características

- 📊 **Visualizaciones Interactivas** - Gráficos de tendencias y categorías
- 💸 **Gestión de Transacciones** - Crear, editar y eliminar ingresos/gastos
- 🎯 **Metas de Ahorro** - Establece y monitorea objetivos financieros
- 💰 **Presupuestos** - Control de gastos por categoría
- 📈 **Resumen Mensual** - Análisis detallado con comparativas
- 🎨 **Diseño Moderno** - UI oscura con gradientes y glassmorphism
- 📱 **Responsive** - Adaptado para desktop, tablet y móvil
- 🔄 **Tiempo Real** - Actualizaciones automáticas con PostgreSQL

## 🎨 Capturas de Pantalla

### Dashboard Principal
![Dashboard](screenshot-dashboard.png)

### Metas de Ahorro
![Metas](screenshot-metas.png)

### Resumen Mensual
![Resumen](screenshot-resumen.png)

## 🚀 Demo en Vivo

[Ver Demo](https://tu-demo-url.com) (si tienes una)

## 📋 Requisitos Previos

- Node.js 14.x o superior
- npm o yarn
- Backend del Dashboard Financiero corriendo en puerto 3001

## 🛠️ Instalación

Tienes **dos opciones**:

### 🐳 Opción 1: Con Docker (Recomendado)

**Requisitos:**
- Docker y Docker Compose

```bash
# Desde la raíz del proyecto
docker-compose up frontend backend postgres -d

# Ver logs
docker-compose logs -f frontend

# El frontend estará en: http://localhost:8000
```

**Reconstruir después de cambios:**
```bash
docker-compose up --build frontend -d
```

📖 Ver [DOCKER_GUIDE.md](../DOCKER_GUIDE.md) para más detalles.

---

### 💻 Opción 2: Instalación Manual

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/dashboard-financiero.git
cd dashboard-financiero/frontend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del frontend:

```env
PORT=8000
REACT_APP_API_URL=http://localhost:3001/api
```

**Para acceso desde otros dispositivos (opcional):**

```env
PORT=8000
REACT_APP_API_URL=http://TU_IP_LOCAL:3001/api
```

Ejemplo:
```env
PORT=8000
REACT_APP_API_URL=http://192.168.1.100:3001/api
```

### 4. Verificar que el backend esté corriendo

El backend debe estar corriendo en `http://localhost:3001`

Prueba visitando: `http://localhost:3001/api/health`

## 🚀 Ejecutar la Aplicación

### 🐳 Con Docker (Recomendado)

**La forma más fácil:**

```bash
# Desde la raíz del proyecto
docker-compose up -d frontend

# Ver logs
docker-compose logs -f frontend

# La aplicación estará en: http://localhost:8000
```

**Reconstruir después de cambios:**
```bash
# Reconstruir imagen
docker-compose build frontend

# Levantar con nueva imagen
docker-compose up -d frontend
```

**Con Makefile:**
```bash
make rebuild-frontend    # Reconstruir y reiniciar
make logs-frontend       # Ver logs
```

---

### 💻 Desarrollo (Sin Docker)

```bash
npm start
```

La aplicación se abrirá automáticamente en: `http://localhost:8000`

### Build para Producción

```bash
npm run build
```

Los archivos optimizados estarán en la carpeta `build/`

### Servir Build de Producción

```bash
npm install -g serve
serve -s build -p 8000
```

## 📦 Dependencias Principales

```json
{
  "react": "^18.2.0",
  "recharts": "^2.10.3",
  "lucide-react": "^0.294.0"
}
```

## 🐳 Docker

### Dockerfile Multi-Stage

El frontend usa un build multi-stage optimizado:

**Etapa 1: Build de React**
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build
```

**Etapa 2: Servir con Nginx**
```dockerfile
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Ventajas:**
- ✅ Imagen final súper ligera (~25MB)
- ✅ Solo contiene archivos estáticos
- ✅ Nginx optimizado para React SPA
- ✅ Cache inteligente de assets
- ✅ Producción ready

### Configuración de Nginx

El frontend incluye `nginx.conf` optimizado:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # Soporte para React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Headers de seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

### Construcción Manual

```bash
# Construir imagen
docker build \
  --build-arg REACT_APP_API_URL=http://localhost:3001/api \
  -t finanzas-frontend .

# Ejecutar contenedor
docker run -p 8000:80 finanzas-frontend
```

### Con docker-compose (Recomendado)

```bash
# Levantar frontend (y dependencias)
docker-compose up -d frontend

# Reconstruir después de cambios en código
docker-compose build frontend
docker-compose up -d frontend

# Ver logs
docker-compose logs -f frontend

# Detener
docker-compose down
```

### Variables de Entorno en Docker

La URL de la API se define en tiempo de build:

```yaml
# En docker-compose.yml
build:
  context: ./frontend
  args:
    REACT_APP_API_URL: http://localhost:3001/api
```

Para cambiarla:

1. Edita `.env`:
   ```env
   REACT_APP_API_URL=http://192.168.1.100:3001/api
   ```

2. Reconstruye:
   ```bash
   docker-compose build frontend
   docker-compose up -d frontend
   ```

### Debugging en Docker

```bash
# Ver logs del contenedor
docker-compose logs -f frontend

# Inspeccionar archivos dentro del contenedor
docker-compose exec frontend sh
ls -la /usr/share/nginx/html

# Ver configuración de nginx
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf

# Reiniciar nginx
docker-compose restart frontend
```

### .dockerignore

El proyecto incluye `.dockerignore` para optimizar:

```
node_modules/
build/
.env
.env.local
.git/
README.md
```

### Cambiar Puerto en Docker

Edita `docker-compose.yml` o `.env`:

```yaml
# docker-compose.yml
frontend:
  ports:
    - "3000:80"  # Puerto_Host:Puerto_Contenedor
```

O en `.env`:
```env
FRONTEND_PORT=3000
```

## 🎯 Funcionalidades Principales

### 1. Dashboard Principal

- **Métricas en tiempo real:**
  - Balance total
  - Ingresos del mes
  - Gastos del mes
  - Tasa de ahorro

- **Gráficos interactivos:**
  - Tendencia de ingresos vs gastos
  - Distribución por categorías

### 2. Transacciones

- ➕ Crear ingresos/gastos
- ✏️ Editar transacciones existentes
- 🗑️ Eliminar transacciones
- 🔍 Filtrar por tipo (todas/ingresos/gastos)
- 🎨 Categorización con colores

### 3. Metas de Ahorro

- 🎯 Crear múltiples metas
- 💰 Asignar fondos desde balance disponible
- 📊 Visualización de progreso
- 🎉 Alertas de cumplimiento
- ♻️ Retirar fondos cuando sea necesario

### 4. Presupuestos

- 💼 Establecer límites por categoría
- 📊 Seguimiento de gasto en tiempo real
- ⚠️ Alertas al exceder 80% del límite
- ✏️ Editar límites existentes
- 🗑️ Eliminar presupuestos

### 5. Resumen Mensual

- 📅 Selector de mes/año
- 📊 Comparación con mes anterior
- 🏆 Mayor gasto identificado
- 📈 Promedio diario
- 💡 Insights automáticos
- 🎨 Desglose detallado por categorías

## 🎨 Paleta de Colores

```css
/* Principales */
--primary: #FFD93D;      /* Amarillo dorado */
--secondary: #4ECDC4;    /* Turquesa */
--success: #6BCF7F;      /* Verde */
--danger: #FF6B9D;       /* Rosa/Rojo */
--warning: #FFA502;      /* Naranja */

/* Fondos */
--bg-dark: #1a1a2e;      /* Azul oscuro */
--bg-medium: #16213e;    /* Azul medio */
--bg-light: #0f3460;     /* Azul claro */
```

## 📱 Uso desde Dispositivos Móviles

### Misma Red WiFi

1. Obtén tu IP local:
   ```bash
   # Windows
   ipconfig
   # Busca "IPv4 Address": 192.168.x.x
   
   # Linux/Mac
   ifconfig | grep "inet "
   ```

2. Actualiza el `.env`:
   ```env
   REACT_APP_API_URL=http://192.168.1.100:3001/api
   ```

3. Asegúrate de que el backend escuche en todas las interfaces (`0.0.0.0`)

4. Desde tu móvil, abre:
   ```
   http://192.168.1.100:8000
   ```

## 🔧 Configuración Avanzada

### Cambiar Puerto

Edita `.env`:
```env
PORT=3000  # O el puerto que prefieras
```

### Personalizar Formato de Moneda

En `FinanceDashboard.jsx`, modifica `formatCurrency`:

```javascript
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CO', {  // Cambia el locale
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};
```

Locales disponibles:
- `'es-CO'` - Colombia (Peso)
- `'en-US'` - Estados Unidos (Dólar)
- `'es-MX'` - México (Peso)
- `'es-AR'` - Argentina (Peso)

### Agregar Nuevas Categorías

Las categorías se gestionan desde la base de datos. Ver documentación del backend.

## 🐛 Solución de Problemas

### "Base de datos desconectada"

**Causa:** Backend no está corriendo o no es accesible

**Solución:**
1. Verifica que el backend esté corriendo en puerto 3001
2. Prueba: `http://localhost:3001/api/health`
3. Verifica CORS en el backend
4. Revisa la URL en `.env`

### Las transacciones no se guardan

**Causa:** Backend no conectado a PostgreSQL

**Solución:**
1. Verifica PostgreSQL esté corriendo
2. Revisa logs del backend
3. Verifica credenciales en backend `.env`

### Advertencias de deprecación al iniciar

**Esto es normal.** Son advertencias de React/Webpack que no afectan el funcionamiento.

Para ocultarlas:
```json
// package.json
"scripts": {
  "start": "set NODE_OPTIONS=--no-deprecation && react-scripts start"
}
```

### Cambios no se reflejan

1. Presiona `Ctrl + Shift + R` (recarga forzada)
2. Limpia caché:
   ```bash
   rmdir /s /q node_modules\.cache  # Windows
   rm -rf node_modules/.cache       # Linux/Mac
   ```
3. Reinicia: `npm start`

## 📁 Estructura del Proyecto

```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   └── FinanceDashboard.jsx    # Componente principal
│   ├── App.js                       # Configuración de rutas
│   └── index.js                     # Punto de entrada
├── .env                             # Variables de entorno
├── package.json
└── README.md
```

## 🚀 Despliegue

### Vercel (Recomendado)

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm run build
# Sube la carpeta build/ a Netlify
```

### Configurar Variables de Entorno en Producción

No olvides configurar:
```
REACT_APP_API_URL=https://tu-api-backend.com/api
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📝 Scripts Disponibles

```bash
npm start          # Inicia servidor de desarrollo
npm run build      # Crea build de producción
npm test           # Ejecuta tests
npm run eject      # Expone configuración de webpack (irreversible)
```

## 🎓 Aprende Más

- [Documentación de React](https://react.dev/)
- [Recharts](https://recharts.org/)
- [Lucide React Icons](https://lucide.dev/)

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👤 Autor

Tu Nombre - [@tu_usuario](https://github.com/tu-usuario)

## 🌟 Roadmap

- [ ] Autenticación de usuarios
- [ ] Múltiples cuentas bancarias
- [ ] Exportar datos a Excel/PDF
- [ ] Notificaciones push
- [ ] Modo claro/oscuro
- [ ] Soporte para múltiples monedas
- [ ] App móvil nativa (React Native)

---

⭐ Si te gustó este proyecto, ¡dale una estrella en GitHub!

## 📸 Más Capturas

### Vista de Presupuestos
![Presupuestos](screenshot-presupuestos.png)

### Gráficos Interactivos
![Gráficos](screenshot-graficos.png)

---

**Desarrollado con ❤️ y ☕**
