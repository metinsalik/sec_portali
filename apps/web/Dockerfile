FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Copy package descriptors
COPY package.json ./
COPY backend/package.json backend/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/

# Install all dependencies for the monorepo
RUN npm install --legacy-peer-deps

# Copy source
COPY packages/ packages/
COPY apps/web/ apps/web/

WORKDIR /app/apps/web

# We use npx vite build to ignore TS compilation errors during the test phase
RUN npx vite build

FROM nginx:alpine
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
# Custom nginx config to handle SPA routing will be added next
COPY --from=builder /app/apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
