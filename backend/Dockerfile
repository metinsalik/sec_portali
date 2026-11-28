FROM node:22-bookworm-slim

WORKDIR /app
RUN apt-get update && apt-get install -y openssl ca-certificates netcat-openbsd procps && rm -rf /var/lib/apt/lists/*

# Add node_modules bins to PATH for direct execution
ENV PATH="/app/node_modules/.bin:/app/backend/node_modules/.bin:$PATH"
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy package descriptors for all workspaces
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY apps/web/package.json apps/web/
COPY packages/ packages/

# Install dependencies (workspaces will link)
RUN node --no-maglev /usr/local/lib/node_modules/npm/bin/npm-cli.js ci --legacy-peer-deps

# Copy source code
COPY backend/ backend/
COPY packages/ packages/

# Ensure uploads directory exists
RUN mkdir -p /app/backend/uploads

# Build shared package
WORKDIR /app/packages/shared
RUN node --no-maglev /app/backend/node_modules/.bin/tsc

WORKDIR /app/backend

# Fix windows line endings
RUN sed -i 's/\r$//' entrypoint.sh
RUN chmod +x entrypoint.sh

# Generate prisma client & build (isolated esbuild in /tmp/esbuild avoids workspace hoisting & V8/tsc crashes)
RUN node --no-maglev --no-wasm-tier-up /app/node_modules/prisma/build/index.js generate --generator client
RUN mkdir -p /tmp/esbuild \
  && node --no-maglev /usr/local/lib/node_modules/npm/bin/npm-cli.js install --prefix /tmp/esbuild --no-save --no-package-lock --no-audit --no-fund esbuild \
  && find src -name '*.ts' ! -path 'src/routes/settings_backup.ts' -print0 | xargs -0 /tmp/esbuild/node_modules/esbuild/bin/esbuild --outdir=dist --outbase=src --format=cjs --platform=node --target=node22 \
  && rm -rf /tmp/esbuild

EXPOSE 3005

ENTRYPOINT []
CMD ["/bin/sh", "/app/backend/entrypoint.sh"]
