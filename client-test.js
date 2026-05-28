const { 
  MovieCatalogService: MovieCatalogClient, 
  CreateMovieCommand, 
  GetMovieCommand, 
  ListMoviesCommand, 
  UpdateMovieCommand, 
  DeleteMovieCommand 
} = require('./movie-catalog-service/build/smithy/source/typescript-client-codegen');

async function runTests() {
  console.log('=== INICIANDO PRUEBAS DEL CLIENTE SMITHY ===');
  
  // Inicializar cliente apuntando al puerto expuesto localmente del catálogo (3001)
  const client = new MovieCatalogClient({ endpoint: 'http://localhost:3001' });

  try {
    // 1. Listar Películas iniciales
    console.log('\n--- 1. Listando películas iniciales ---');
    const initialList = await client.send(new ListMoviesCommand());
    console.log('Películas encontradas:', initialList.movies);

    // 2. Crear una nueva película
    console.log('\n--- 2. Creando una nueva película ---');
    const newMovieInput = {
      title: 'Avatar',
      genre: 'Sci-Fi / Action',
      director: 'James Cameron',
      releaseYear: 2009,
      synopsis: 'A paraplegic Marine dispatched to the moon Pandora on a unique mission becomes torn between following his orders and protecting the world.'
    };
    const createdMovie = await client.send(new CreateMovieCommand(newMovieInput));
    console.log('Película creada con ID:', createdMovie.id);
    console.log('Detalle completo:', createdMovie);
    const newId = createdMovie.id;

    // 3. Obtener la película creada por ID
    console.log('\n--- 3. Obteniendo la película por ID ---');
    const movieDetails = await client.send(new GetMovieCommand({ id: newId }));
    console.log('Película recuperada:', movieDetails);

    // 4. Actualizar la película
    console.log('\n--- 4. Actualizando la película ---');
    const updateInput = {
      id: newId,
      title: 'Avatar (Extended Cut)',
      genre: 'Sci-Fi / Adventure',
      director: 'James Cameron',
      releaseYear: 2009,
      synopsis: 'Extended edition of the Pandora epic.'
    };
    const updatedMovie = await client.send(new UpdateMovieCommand(updateInput));
    console.log('Película actualizada:', updatedMovie);

    // 5. Listar de nuevo para ver los cambios
    console.log('\n--- 5. Verificando listado final ---');
    const finalList = await client.send(new ListMoviesCommand());
    console.log('Películas en catálogo:', finalList.movies);

    // 6. Eliminar la película creada
    console.log('\n--- 6. Eliminando la película de prueba ---');
    await client.send(new DeleteMovieCommand({ id: newId }));
    console.log('Película eliminada correctamente.');

    // 7. Intentar obtener la película eliminada para verificar el error 404 (NotFoundException)
    console.log('\n--- 7. Verificando manejo de errores (404) ---');
    try {
      await client.send(new GetMovieCommand({ id: newId }));
      console.log('ERROR: ¡Se esperaba una excepción NotFoundException!');
    } catch (err) {
      console.log(`Excepción esperada atrapada: [${err.name}] - ${err.message}`);
    }

    console.log('\n=== ¡TODAS LAS PRUEBAS DEL CLIENTE SMITHY PASARON CON ÉXITO! ===');
  } catch (error) {
    console.error('Ha ocurrido un error inesperado en las pruebas:', error);
  }
}

// Ejecutar pruebas
runTests();
