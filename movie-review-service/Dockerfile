FROM node:20-slim

WORKDIR /app

# Instalar dependencias de compilación para SQLite
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY movie-review-service/package*.json ./

RUN npm install

COPY movie-review-service/ .

EXPOSE 3002

CMD ["npm", "start"]
