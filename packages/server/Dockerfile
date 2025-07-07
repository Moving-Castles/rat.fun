# ---- Builder stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy monorepo files
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY packages ./packages

# Install all dependencies and build only the server
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm --filter server build

# ---- Production stage ----
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace files and all packages for dependency resolution
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY packages ./packages
COPY --from=builder /app/packages/server/dist ./packages/server/dist

# Create non-root user first
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Install only production dependencies for server
RUN pnpm install --prod --ignore-scripts --filter server...

# Create and set permissions for db-files directory
RUN mkdir -p /app/packages/server/db-files && chown -R nodejs:nodejs /app/packages/server/db-files

USER nodejs

EXPOSE 3131

CMD ["pnpm", "--filter", "server", "start"] 