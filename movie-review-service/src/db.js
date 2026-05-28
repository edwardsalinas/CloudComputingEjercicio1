const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const fs = require('fs');

const dir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}
const dbPath = path.join(dir, 'reviews.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos de reseñas:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite (reviews.db).');
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      movieId TEXT NOT NULL,
      author TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT,
      createdAt TEXT NOT NULL
    )
  `);

  // Sembrar datos iniciales si está vacío
  db.get("SELECT COUNT(*) as count FROM reviews", [], (err, row) => {
    if (err) {
      console.error('Error al comprobar registros de reseñas:', err.message);
      return;
    }

    if (row.count === 0) {
      console.log('Sembrando datos iniciales en la tabla de reseñas...');
      const insert = db.prepare(`
        INSERT INTO reviews (id, movieId, author, rating, comment, createdAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      // Reseñas de prueba vinculadas a movieId '1' (Inception) y '2' (The Matrix)
      insert.run('r1', '1', 'Alice', 5, 'Absolute masterpiece! Nolan does it again.', new Date().toISOString());
      insert.run('r2', '1', 'Bob', 4, 'Mind-bending plot, outstanding soundtrack.', new Date().toISOString());
      insert.run('r3', '2', 'Charlie', 5, 'Revolutionary special effects and a legendary concept.', new Date().toISOString());
      
      insert.finalize();
      console.log('Reseñas iniciales sembradas con éxito.');
    }
  });
});

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
