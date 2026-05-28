const express = require('express');
const db = require('./db');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3002;
const CATALOG_URL = process.env.MOVIE_CATALOG_SERVICE_URL || 'http://localhost:3001';

// 1. POST /reviews -> CreateReview (con validación inter-servicio mediante REST directo con Axios)
app.post('/reviews', async (req, res) => {
  const { movieId, author, rating, comment } = req.body;

  // Validación de entrada
  if (!movieId || !author || rating === undefined) {
    return res.status(400).json({ message: 'ValidationException: movieId, author, and rating are required fields.' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'ValidationException: rating must be between 1 and 5.' });
  }

  try {
    // COMUNICACIÓN ENTRE MICROSERVICIOS: REST puro por HTTP usando Axios
    console.log(`[Servicio B] Validando existencia de película ID: ${movieId} vía REST directo...`);
    try {
      await axios.get(`${CATALOG_URL}/movies/${movieId}`);
      console.log(`[Servicio B] Película ID: ${movieId} validada con éxito.`);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return res.status(400).json({ 
          message: `MovieNotFoundException: La película con ID ${movieId} no existe en el catálogo. Reseña rechazada.` 
        });
      }
      // Re-lanzar errores de red o servidor general
      throw err;
    }

    // Insertar reseña en la DB SQLite local de reseñas
    const id = 'r_' + crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await db.run(
      'INSERT INTO reviews (id, movieId, author, rating, comment, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [id, movieId, author, rating, comment || '', createdAt]
    );

    res.status(201).json({
      id,
      movieId,
      author,
      rating,
      comment: comment || '',
      createdAt
    });
  } catch (err) {
    console.error('Error al crear reseña:', err.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 2. GET /reviews/:id -> GetReview (con Enriquecimiento inter-servicio vía REST directo con Axios)
app.get('/reviews/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const review = await db.get('SELECT * FROM reviews WHERE id = ?', [id]);
    if (!review) {
      return res.status(404).json({ message: `NotFoundException: Reseña con ID ${id} no encontrada.` });
    }

    // COMUNICACIÓN ENTRE MICROSERVICIOS: REST puro por HTTP usando Axios para enriquecer la respuesta
    let movieTitle = 'Desconocido';
    let movieGenre = 'Desconocido';
    
    try {
      console.log(`[Servicio B] Consultando catálogo REST para película ID: ${review.movieId}...`);
      const movieResponse = await axios.get(`${CATALOG_URL}/movies/${review.movieId}`);
      movieTitle = movieResponse.data.title;
      movieGenre = movieResponse.data.genre;
    } catch (err) {
      console.warn(`[Servicio B] No se pudo obtener detalles de la película ID: ${review.movieId} para enriquecer. Continuado con valores por defecto.`);
    }

    res.status(200).json({
      id: review.id,
      movieId: review.movieId,
      author: review.author,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      movieTitle,
      movieGenre
    });
  } catch (err) {
    console.error('Error al obtener reseña:', err.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 3. GET /reviews/movie/:movieId -> ListReviewsForMovie
app.get('/reviews/movie/:movieId', async (req, res) => {
  const { movieId } = req.params;
  try {
    const rows = await db.all('SELECT * FROM reviews WHERE movieId = ?', [movieId]);
    res.status(200).json({ reviews: rows });
  } catch (err) {
    console.error('Error al listar reseñas:', err.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 4. DELETE /reviews/:id -> DeleteReview
app.delete('/reviews/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await db.get('SELECT id FROM reviews WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ message: `NotFoundException: Reseña con ID ${id} no encontrada.` });
    }

    await db.run('DELETE FROM reviews WHERE id = ?', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Error al eliminar reseña:', err.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Movie Review Service (Servicio B) corriendo en puerto ${PORT}`);
  console.log(`Conectado al Servicio de Catálogo en: ${CATALOG_URL}`);
});
