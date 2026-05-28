const express = require('express');
const db = require('./db');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

// 1. GET /movies -> ListMovies
app.get('/movies', async (req, res) => {
  try {
    const rows = await db.all('SELECT id, title, genre FROM movies');
    res.status(200).json({ movies: rows });
  } catch (err) {
    console.error('Error al listar películas:', err.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 2. GET /movies/:id -> GetMovie
app.get('/movies/:id', async (req, res) => {
  try {
    const movie = await db.get('SELECT * FROM movies WHERE id = ?', [req.params.id]);
    if (!movie) {
      return res.status(404).json({ message: `NotFoundException: Movie with ID ${req.params.id} not found` });
    }
    res.status(200).json(movie);
  } catch (err) {
    console.error('Error al obtener película:', err.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 3. POST /movies -> CreateMovie
app.post('/movies', async (req, res) => {
  const { title, genre, director, releaseYear, synopsis } = req.body;
  
  // Validación según contrato
  if (!title || !genre || !director || releaseYear === undefined) {
    return res.status(400).json({ message: 'ValidationException: title, genre, director, and releaseYear are required fields.' });
  }

  try {
    const id = crypto.randomUUID();
    await db.run(
      'INSERT INTO movies (id, title, genre, director, releaseYear, synopsis) VALUES (?, ?, ?, ?, ?, ?)',
      [id, title, genre, director, releaseYear, synopsis || '']
    );
    res.status(201).json({ id, title, genre, director, releaseYear, synopsis: synopsis || '' });
  } catch (err) {
    console.error('Error al crear película:', err.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 4. PUT /movies/:id -> UpdateMovie
app.put('/movies/:id', async (req, res) => {
  const { id: routeId } = req.params;
  const { title, genre, director, releaseYear, synopsis } = req.body;

  // Validación
  if (!title || !genre || !director || releaseYear === undefined) {
    return res.status(400).json({ message: 'ValidationException: title, genre, director, and releaseYear are required fields.' });
  }

  try {
    const existing = await db.get('SELECT id FROM movies WHERE id = ?', [routeId]);
    if (!existing) {
      return res.status(404).json({ message: `NotFoundException: Movie with ID ${routeId} not found` });
    }

    await db.run(
      'UPDATE movies SET title = ?, genre = ?, director = ?, releaseYear = ?, synopsis = ? WHERE id = ?',
      [title, genre, director, releaseYear, synopsis || '', routeId]
    );

    res.status(200).json({ id: routeId, title, genre, director, releaseYear, synopsis: synopsis || '' });
  } catch (err) {
    console.error('Error al actualizar película:', err.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 5. DELETE /movies/:id -> DeleteMovie
app.delete('/movies/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await db.get('SELECT id FROM movies WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ message: `NotFoundException: Movie with ID ${id} not found` });
    }

    await db.run('DELETE FROM movies WHERE id = ?', [id]);
    res.status(204).send(); // 204 No Content
  } catch (err) {
    console.error('Error al eliminar película:', err.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Movie Catalog Service (Servicio A) corriendo en puerto ${PORT}`);
});
