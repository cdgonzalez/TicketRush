# Etapa 1: Dependencias base
FROM node:22-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./

# Etapa 2: Entorno de construcción (Build)
FROM base AS builder
RUN npm ci
COPY . .
RUN npm run build

# Etapa 3: Entorno de producción (Runner)
FROM base AS runner
ENV NODE_ENV=production
# Instalar solo dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Copiar el código compilado desde la etapa builder
COPY --from=builder /usr/src/app/dist ./dist

# Ejecutar como usuario no root por seguridad
USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]