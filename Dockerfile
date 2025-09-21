FROM node:20 AS builder

# 1. Собираем клиент
# WORKDIR /client
# COPY client/package*.json ./
# RUN npm install
# COPY client/ .
# ARG VITE_WEB_URL
# ENV VITE_WEB_URL=$VITE_WEB_URL
# RUN npm run build

# 2. Собираем сервер
WORKDIR /server
COPY server/package*.json ./
RUN npm install
COPY server/ .
# RUN mkdir -p public && cp -r /client/dist/* public/
RUN npm run build

# 3. Продакшен образ с mongodump
FROM node:20-slim
WORKDIR /app

# Устанавливаем MongoDB tools
RUN apt-get update && apt-get install -y wget gnupg \
    && wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add - \
    && echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/debian bullseye/mongodb-org/6.0 main" \
    | tee /etc/apt/sources.list.d/mongodb-org-6.0.list \
    && apt-get update \
    && apt-get install -y mongodb-database-tools \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=builder /server ./

CMD ["npm", "run", "start:prod"]

