const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const db = require('./db');
const crypto = require('crypto');

// Cargar el archivo .proto
const PROTO_PATH = path.join(__dirname, '../proto/movie-catalog.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const movieProto = grpc.loadPackageDefinition(packageDefinition).moviecatalog;

// 1. RPC GetMovie
const getMovie = async (call, callback) => {
  const { id } = call.request;
  console.log(`[gRPC Server] getMovie llamado con ID: ${id}`);
  
  if (!id) {
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      details: 'ID de película es requerido.'
    });
  }

  try {
    const movie = await db.get('SELECT * FROM movies WHERE id = ?', [id]);
    if (!movie) {
      return callback({
        code: grpc.status.NOT_FOUND,
        details: `Movie with ID ${id} not found`
      });
    }
    
    callback(null, { movie: {
      id: movie.id,
      title: movie.title,
      genre: movie.genre,
      director: movie.director,
      releaseYear: movie.releaseYear,
      synopsis: movie.synopsis || ''
    }});
  } catch (err) {
    console.error('Error en getMovie:', err.message);
    callback({
      code: grpc.status.INTERNAL,
      details: 'Error interno de la base de datos.'
    });
  }
};

// 2. RPC ListMovies
const listMovies = async (call, callback) => {
  console.log('[gRPC Server] listMovies llamado');
  try {
    const rows = await db.all('SELECT * FROM movies');
    const movies = rows.map(movie => ({
      id: movie.id,
      title: movie.title,
      genre: movie.genre,
      director: movie.director,
      releaseYear: movie.releaseYear,
      synopsis: movie.synopsis || ''
    }));
    callback(null, { movies });
  } catch (err) {
    console.error('Error en listMovies:', err.message);
    callback({
      code: grpc.status.INTERNAL,
      details: 'Error interno de la base de datos.'
    });
  }
};

// 3. RPC CreateMovie
const createMovie = async (call, callback) => {
  const { title, genre, director, releaseYear, synopsis } = call.request;
  console.log(`[gRPC Server] createMovie llamado para título: ${title}`);

  if (!title || !genre || !director || releaseYear === undefined) {
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      details: 'title, genre, director, y releaseYear son requeridos.'
    });
  }

  try {
    const id = crypto.randomUUID();
    await db.run(
      'INSERT INTO movies (id, title, genre, director, releaseYear, synopsis) VALUES (?, ?, ?, ?, ?, ?)',
      [id, title, genre, director, releaseYear, synopsis || '']
    );

    callback(null, { movie: {
      id,
      title,
      genre,
      director,
      releaseYear,
      synopsis: synopsis || ''
    }});
  } catch (err) {
    console.error('Error en createMovie:', err.message);
    callback({
      code: grpc.status.INTERNAL,
      details: 'Error al insertar película en la base de datos.'
    });
  }
};

// 4. RPC UpdateMovie
const updateMovie = async (call, callback) => {
  const { id, title, genre, director, releaseYear, synopsis } = call.request;
  console.log(`[gRPC Server] updateMovie llamado para ID: ${id}`);

  if (!id || !title || !genre || !director || releaseYear === undefined) {
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      details: 'id, title, genre, director, y releaseYear son requeridos.'
    });
  }

  try {
    const existing = await db.get('SELECT id FROM movies WHERE id = ?', [id]);
    if (!existing) {
      return callback({
        code: grpc.status.NOT_FOUND,
        details: `Movie with ID ${id} not found`
      });
    }

    await db.run(
      'UPDATE movies SET title = ?, genre = ?, director = ?, releaseYear = ?, synopsis = ? WHERE id = ?',
      [title, genre, director, releaseYear, synopsis || '', id]
    );

    callback(null, { movie: {
      id,
      title,
      genre,
      director,
      releaseYear,
      synopsis: synopsis || ''
    }});
  } catch (err) {
    console.error('Error en updateMovie:', err.message);
    callback({
      code: grpc.status.INTERNAL,
      details: 'Error al actualizar película en la base de datos.'
    });
  }
};

// 5. RPC DeleteMovie
const deleteMovie = async (call, callback) => {
  const { id } = call.request;
  console.log(`[gRPC Server] deleteMovie llamado para ID: ${id}`);

  if (!id) {
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      details: 'ID de película es requerido.'
    });
  }

  try {
    const existing = await db.get('SELECT id FROM movies WHERE id = ?', [id]);
    if (!existing) {
      return callback({
        code: grpc.status.NOT_FOUND,
        details: `Movie with ID ${id} not found`
      });
    }

    await db.run('DELETE FROM movies WHERE id = ?', [id]);
    callback(null, { success: true });
  } catch (err) {
    console.error('Error en deleteMovie:', err.message);
    callback({
      code: grpc.status.INTERNAL,
      details: 'Error al eliminar película en la base de datos.'
    });
  }
};

// Inicializar y levantar el servidor gRPC
const server = new grpc.Server();
server.addService(movieProto.MovieCatalogService.service, {
  getMovie,
  listMovies,
  createMovie,
  updateMovie,
  deleteMovie
});

const PORT = process.env.GRPC_PORT || '50051';
server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error('Error al iniciar el servidor gRPC:', err);
    return;
  }
  console.log(`Movie Catalog gRPC Service (Servicio Backend) corriendo en el puerto ${port}`);
  server.start();
});
