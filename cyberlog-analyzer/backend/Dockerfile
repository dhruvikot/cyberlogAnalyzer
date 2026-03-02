FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

RUN npm install

COPY src ./src

RUN npx prisma generate
RUN npx tsc --outDir dist --module commonjs --target ES2020 --esModuleInterop true --skipLibCheck true --resolveJsonModule true src/server.ts || true

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
