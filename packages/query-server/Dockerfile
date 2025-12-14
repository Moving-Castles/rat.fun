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

# Install all dependencies and build only the query-server
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm --filter query-server build

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
COPY --from=builder /app/packages/query-server/dist ./packages/query-server/dist

# Create non-root user first
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Install only production dependencies for query-server
RUN pnpm install --prod --ignore-scripts --filter query-server...

# Change ownership of all files to nodejs user
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

CMD ["pnpm", "--filter", "query-server", "start"]
