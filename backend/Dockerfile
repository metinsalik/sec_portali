FROM node:20-alpine

WORKDIR /app
RUN apk add --no-cache openssl busybox-extras

COPY package*.json ./
RUN npm install

COPY . .

# Fix windows line endings
RUN sed -i 's/\r$//' entrypoint.sh
RUN chmod +x entrypoint.sh

# Generate prisma client & build typescript
RUN npx prisma generate
RUN npm run build

EXPOSE 3005

ENTRYPOINT []
CMD ["/bin/sh", "/app/entrypoint.sh"]
