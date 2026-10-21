FROM node:20-bookworm-slim

WORKDIR /app
RUN apt-get update && apt-get install -y openssl ca-certificates netcat-openbsd procps && rm -rf /var/lib/apt/lists/*

# Add node_modules bins to PATH for direct execution
ENV PATH="/app/node_modules/.bin:/app/backend/node_modules/.bin:$PATH"

# Copy package descriptors for all workspaces
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY apps/web/package.json apps/web/
COPY packages/ packages/

# Install dependencies (workspaces will link)
RUN NODE_OPTIONS="--max-old-space-size=4096" npm ci --legacy-peer-deps

# Copy source code
COPY backend/ backend/
COPY packages/ packages/

# Ensure uploads directory exists
RUN mkdir -p /app/backend/uploads

# Build shared package
WORKDIR /app/packages/shared
RUN NODE_OPTIONS="--max-old-space-size=4096" /app/backend/node_modules/.bin/tsc

WORKDIR /app/backend

# Fix windows line endings
RUN sed -i 's/\r$//' entrypoint.sh
RUN chmod +x entrypoint.sh

# Generate prisma client & build
RUN NODE_OPTIONS="--max-old-space-size=4096" node /app/node_modules/prisma/build/index.js generate --generator client
RUN NODE_OPTIONS="--max-old-space-size=4096" /app/backend/node_modules/.bin/tsc

EXPOSE 3005

ENTRYPOINT []
CMD ["/bin/sh", "/app/backend/entrypoint.sh"]
