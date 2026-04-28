# ── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package files first so Docker caches this layer
COPY package*.json ./
RUN npm ci

COPY . .

# Generate Prisma client (no real DB connection needed for this step)
RUN DATABASE_URL=mysql://build:build@localhost:3306/build npx prisma generate

# Compile TypeScript → dist/
RUN npm run build

# ── Stage 2: Runtime ────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

# Install production dependencies only (smaller image)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled app from builder (includes the generated Prisma client)
COPY --from=builder /app/dist ./dist

# Copy Prisma schema and migrations so we can run migrate deploy at startup
COPY --from=builder /app/prisma ./prisma

# Copy the compiled config so the Prisma CLI can find it at runtime
COPY --from=builder /app/dist/prisma.config.js ./prisma.config.js

EXPOSE 3000

# Run pending migrations then start the app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
