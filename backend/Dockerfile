FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl busybox-extras

COPY package*.json ./
RUN npm install

COPY . .
RUN sed -i 's/\r$//' entrypoint.sh
RUN chmod +x entrypoint.sh
RUN npx prisma generate

EXPOSE 3005

ENTRYPOINT []
CMD ["/bin/sh", "/app/entrypoint.sh"]
