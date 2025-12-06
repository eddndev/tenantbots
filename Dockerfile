# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy backend dependencies
COPY package*.json ./
RUN npm ci

# Copy backend source
COPY tsconfig.json .
COPY src ./src
COPY prisma ./prisma

# Build backend
RUN npx prisma generate
RUN npm run build

# Frontend Build Stage
# We do this in the same builder or a separate one. Let's send everything to builder first.
COPY client ./client
WORKDIR /app/client
RUN npm ci
RUN npm run build

# Production Stage
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built backend
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Copy built frontend
COPY --from=builder /app/client/dist ./client/dist

# Copy auth info if needed (usually a volume)
# COPY auth_info_baileys ./auth_info_baileys

EXPOSE 3000

CMD ["node", "dist/server.js"]
