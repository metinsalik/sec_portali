FROM node:22-bookworm-slim AS builder

WORKDIR /app

ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy package descriptors
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY apps/web/package.json apps/web/
COPY packages/ packages/

# Install all dependencies for the monorepo
RUN node --no-maglev /usr/local/lib/node_modules/npm/bin/npm-cli.js ci --legacy-peer-deps --ignore-scripts --no-audit --no-fund
RUN node --no-maglev /usr/local/lib/node_modules/npm/bin/npm-cli.js install --no-save --no-package-lock --legacy-peer-deps --ignore-scripts --no-audit --no-fund @rolldown/binding-linux-x64-gnu@1.0.0-rc.15 lightningcss-linux-x64-gnu@1.32.0 @tailwindcss/oxide-linux-x64-gnu@4.2.2

# Copy source
COPY packages/ packages/
COPY apps/web/ apps/web/

WORKDIR /app/apps/web

ENV RUST_BACKTRACE=full
ENV RAYON_NUM_THREADS=2
RUN VITE_BIN=$([ -f /app/apps/web/node_modules/.bin/vite ] && echo /app/apps/web/node_modules/.bin/vite || echo /app/node_modules/.bin/vite) && node --no-maglev "$VITE_BIN" build

FROM nginx:alpine
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
# Custom nginx config to handle SPA routing will be added next
COPY --from=builder /app/apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
