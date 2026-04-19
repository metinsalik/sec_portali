FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl busybox-extras

COPY package*.json ./
RUN npm install

COPY . .
RUN chmod +x entrypoint.sh
RUN npx prisma generate

EXPOSE 3005

CMD ["./entrypoint.sh"]
