FROM node:18

RUN apt-get update && apt-get install -y openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY tsconfig.json ./

RUN npm install

COPY src ./src

RUN npx prisma generate

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && npx ts-node src/server.ts"]
