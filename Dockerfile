# ==========================================
# StagePilot Multi-Stage Production Dockerfile
# ==========================================

# 1. Build Client Assets
FROM node:20-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# 2. Production Server Image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install server dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --only=production

# Copy server source code
COPY server/ ./

# Copy built frontend assets from client-builder stage
COPY --from=client-builder /app/client/dist /app/client/dist

# Expose backend & WebSocket port
EXPOSE 5000

# Start StagePilot Server
CMD ["node", "src/server.js"]
