# Dockerfile para Backend - Dashboard Financiero
FROM node:18-alpine

# Crear directorio de la app
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar el resto de archivos
COPY . .

# Exponer puerto
EXPOSE 3001

# Variables de entorno por defecto (se pueden sobrescribir con docker-compose)
ENV NODE_ENV=production
ENV PORT=3001

# Comando para iniciar la aplicación
CMD ["node", "server.js"]
