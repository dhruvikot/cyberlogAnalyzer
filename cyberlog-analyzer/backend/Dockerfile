FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm install -g tsx

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && tsx src/server.ts"]
