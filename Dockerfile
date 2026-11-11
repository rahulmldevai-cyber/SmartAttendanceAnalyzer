# ─── Backend ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS backend-deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production

# ─── Frontend build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ─── Production image ─────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Security: run as non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodeapp -u 1001

# Copy backend
COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend/

# Copy built frontend into backend's static dir
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Create necessary directories
RUN mkdir -p backend/logs backend/uploads && \
    chown -R nodeapp:nodejs /app

USER nodeapp

WORKDIR /app/backend
EXPOSE 5000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["node", "server.js"]
