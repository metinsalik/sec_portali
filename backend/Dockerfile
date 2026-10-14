FROM node:20-bookworm-slim

WORKDIR /app
RUN apt-get update && apt-get install -y openssl netcat-openbsd && rm -rf /var/lib/apt/lists/*

# Copy package descriptors for all workspaces
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY apps/web/package.json apps/web/
COPY packages/ packages/

# Install dependencies (workspaces will link)
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm ci --legacy-peer-deps

# Copy source code
COPY backend/ backend/
COPY packages/ packages/

WORKDIR /app/backend

# Fix windows line endings
RUN sed -i 's/\r$//' entrypoint.sh
RUN chmod +x entrypoint.sh

# Generate prisma client & build
RUN npx prisma generate --generator client
RUN npx tsc

EXPOSE 3005

ENTRYPOINT []
CMD ["/bin/sh", "/app/backend/entrypoint.sh"]
