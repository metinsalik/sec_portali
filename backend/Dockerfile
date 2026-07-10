FROM node:20-bookworm-slim

WORKDIR /app
RUN apt-get update && apt-get install -y openssl netcat-openbsd && rm -rf /var/lib/apt/lists/*

# Copy package descriptors for all workspaces
COPY package.json ./
COPY backend/package.json backend/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/

# Install dependencies (workspaces will link)
RUN npm install --legacy-peer-deps

# Copy source code
COPY backend/ backend/
COPY packages/ packages/

WORKDIR /app/backend

# Fix windows line endings
RUN sed -i 's/\r$//' entrypoint.sh
RUN chmod +x entrypoint.sh

# Generate prisma client & zod types
RUN npx prisma generate
RUN npm run build

EXPOSE 3005

ENTRYPOINT []
CMD ["/bin/sh", "/app/backend/entrypoint.sh"]
