$version: "2.0"

namespace com.movies.catalog

use aws.protocols#restJson1

/// Servicio de catálogo de películas que expone operaciones CRUD.
@restJson1
service MovieCatalogService {
    version: "2026-05-27"
    resources: [Movie]
}

resource Movie {
    identifiers: { id: String }
    create: CreateMovie
    read: GetMovie
    update: UpdateMovie
    delete: DeleteMovie
    list: ListMovies
}

/// Crea una nueva película en el catálogo.
@http(method: "POST", uri: "/movies", code: 201)
operation CreateMovie {
    input: CreateMovieInput
    output: CreateMovieOutput
    errors: [ValidationException, ConflictException]
}

structure CreateMovieInput {
    @required
    title: String
    @required
    genre: String
    @required
    director: String
    @required
    releaseYear: Integer
    synopsis: String
}

structure CreateMovieOutput {
    @required
    id: String
    @required
    title: String
    @required
    genre: String
    @required
    director: String
    @required
    releaseYear: Integer
    synopsis: String
}

/// Obtiene los detalles de una película específica por su ID.
@readonly
@http(method: "GET", uri: "/movies/{id}", code: 200)
operation GetMovie {
    input: GetMovieInput
    output: GetMovieOutput
    errors: [NotFoundException]
}

structure GetMovieInput {
    @required
    @httpLabel
    id: String
}

structure GetMovieOutput {
    @required
    id: String
    @required
    title: String
    @required
    genre: String
    @required
    director: String
    @required
    releaseYear: Integer
    synopsis: String
}

/// Actualiza una película existente por su ID.
@http(method: "PUT", uri: "/movies/{id}", code: 200)
operation UpdateMovie {
    input: UpdateMovieInput
    output: UpdateMovieOutput
    errors: [NotFoundException, ValidationException]
}

structure UpdateMovieInput {
    @required
    @httpLabel
    id: String
    @required
    title: String
    @required
    genre: String
    @required
    director: String
    @required
    releaseYear: Integer
    synopsis: String
}

structure UpdateMovieOutput {
    @required
    id: String
    @required
    title: String
    @required
    genre: String
    @required
    director: String
    @required
    releaseYear: Integer
    synopsis: String
}

/// Elimina una película por su ID.
@idempotent
@http(method: "DELETE", uri: "/movies/{id}", code: 204)
operation DeleteMovie {
    input: DeleteMovieInput
    output: DeleteMovieOutput
    errors: [NotFoundException]
}

structure DeleteMovieInput {
    @required
    @httpLabel
    id: String
}

structure DeleteMovieOutput {}

/// Obtiene el listado resumido de todas las películas.
@readonly
@http(method: "GET", uri: "/movies", code: 200)
operation ListMovies {
    output: ListMoviesOutput
}

structure ListMoviesOutput {
    @required
    movies: MovieSummaries
}

list MovieSummaries {
    member: MovieSummary
}

structure MovieSummary {
    @required
    id: String
    @required
    title: String
    @required
    genre: String
}

/// Error cuando la petición contiene datos inválidos.
@error("client")
@httpError(400)
structure ValidationException {
    @required
    message: String
}

/// Error cuando el recurso solicitado no existe.
@error("client")
@httpError(404)
structure NotFoundException {
    @required
    message: String
}

/// Error cuando hay un conflicto (por ejemplo, duplicado).
@error("client")
@httpError(409)
structure ConflictException {
    @required
    message: String
}
