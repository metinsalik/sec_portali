FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Copy package descriptors
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY apps/web/package.json apps/web/
COPY packages/ packages/

# Install all dependencies for the monorepo
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm ci --legacy-peer-deps --ignore-scripts
RUN npm install --no-save @rolldown/binding-linux-x64-gnu@1.0.0-rc.15 lightningcss-linux-x64-gnu@1.32.0 @tailwindcss/oxide-linux-x64-gnu@4.2.2

# Copy source
COPY packages/ packages/
COPY apps/web/ apps/web/

WORKDIR /app/apps/web

RUN npx vite build

FROM nginx:alpine
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
# Custom nginx config to handle SPA routing will be added next
COPY --from=builder /app/apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
