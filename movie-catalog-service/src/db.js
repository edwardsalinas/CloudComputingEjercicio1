const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const fs = require('fs');

const dir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}
const dbPath = path.join(dir, 'movies.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos de películas:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite (movies.db).');
  }
});

// Inicializar tablas y sembrar datos
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS movies (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      genre TEXT NOT NULL,
      director TEXT NOT NULL,
      releaseYear INTEGER NOT NULL,
      synopsis TEXT
    )
  `);

  // Insertar datos de prueba si la tabla está vacía
  db.get("SELECT COUNT(*) as count FROM movies", [], (err, row) => {
    if (err) {
      console.error('Error al comprobar registros:', err.message);
      return;
    }

    if (row.count === 0) {
      console.log('Sembrando datos iniciales en la tabla de películas...');
      const insert = db.prepare(`
        INSERT INTO movies (id, title, genre, director, releaseYear, synopsis)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      insert.run('1', 'Inception', 'Sci-Fi', 'Christopher Nolan', 2010, 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea.');
      insert.run('2', 'The Matrix', 'Sci-Fi', 'Lana Wachowski, Lilly Wachowski', 1999, 'When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth.');
      insert.run('3', 'Interstellar', 'Sci-Fi', 'Christopher Nolan', 2014, 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity survival.');
      
      insert.finalize();
      console.log('Datos iniciales sembrados con éxito.');
    }
  });
});

// Envolver métodos en Promesas para fácil uso con async/await
const dbQuery = {
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }
};

module.exports = dbQuery;
