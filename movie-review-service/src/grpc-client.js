const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, '../proto/movie-catalog.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const movieProto = grpc.loadPackageDefinition(packageDefinition).moviecatalog;

// Leer dirección del servidor gRPC de variables de entorno
const CATALOG_HOST = process.env.MOVIE_CATALOG_GRPC_HOST || 'localhost:50051';
console.log(`[gRPC Client] Conectándose al Catálogo gRPC en: ${CATALOG_HOST}`);

const client = new movieProto.MovieCatalogService(
  CATALOG_HOST,
  grpc.credentials.createInsecure()
);

// Wrapper con Promesas para simplificar el uso con async/await
const getMovie = (id) => {
  return new Promise((resolve, reject) => {
    client.getMovie({ id }, (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response.movie);
      }
    });
  });
};

const listMovies = () => {
  return new Promise((resolve, reject) => {
    client.listMovies({}, (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response.movies);
      }
    });
  });
};

module.exports = {
  getMovie,
  listMovies
};
