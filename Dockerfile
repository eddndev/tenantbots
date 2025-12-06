# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production Stage
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
# Baileys auth folder should be mounted as volume or preserved
RUN mkdir -p auth_info_baileys

EXPOSE 3000

CMD ["node", "dist/server.js"]
