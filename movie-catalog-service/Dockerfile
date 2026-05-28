FROM node:20-slim

WORKDIR /app

# Instalar dependencias de compilación para SQLite
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY movie-catalog-service/package*.json ./

RUN npm install

COPY movie-catalog-service/ .

EXPOSE 50051

CMD ["npm", "start"]
