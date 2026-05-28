$version: "2.0"

namespace com.movies.reviews

use aws.protocols#restJson1

/// Servicio de reseñas de películas que permite calificar y comentar sobre ellas.
@restJson1
service MovieReviewService {
    version: "2026-05-27"
    resources: [Review]
}

resource Review {
    identifiers: { id: String }
    create: CreateReview
    read: GetReview
    delete: DeleteReview
    list: ListReviewsForMovie
}

/// Crea una reseña para una película específica.
/// NOTA: Esta operación se comunica internamente con MovieCatalogService para validar si la película existe.
@http(method: "POST", uri: "/reviews", code: 201)
operation CreateReview {
    input: CreateReviewInput
    output: CreateReviewOutput
    errors: [ValidationException, MovieNotFoundException]
}

structure CreateReviewInput {
    @required
    movieId: String
    @required
    author: String
    @required
    rating: Integer
    comment: String
}

structure CreateReviewOutput {
    @required
    id: String
    @required
    movieId: String
    @required
    author: String
    @required
    rating: Integer
    comment: String
    @required
    createdAt: String
}

/// Obtiene los detalles de una reseña incluyendo información enriquecida de la película.
/// NOTA: Esta operación consulta internamente a MovieCatalogService para obtener el título y género.
@readonly
@http(method: "GET", uri: "/reviews/{id}", code: 200)
operation GetReview {
    input: GetReviewInput
    output: GetReviewOutput
    errors: [NotFoundException]
}

structure GetReviewInput {
    @required
    @httpLabel
    id: String
}

structure GetReviewOutput {
    @required
    id: String
    @required
    movieId: String
    @required
    author: String
    @required
    rating: Integer
    comment: String
    @required
    createdAt: String
    
    // Campos enriquecidos mediante llamada HTTP al catálogo
    movieTitle: String
    movieGenre: String
}

/// Elimina una reseña por su ID.
@idempotent
@http(method: "DELETE", uri: "/reviews/{id}", code: 204)
operation DeleteReview {
    input: DeleteReviewInput
    output: DeleteReviewOutput
    errors: [NotFoundException]
}

structure DeleteReviewInput {
    @required
    @httpLabel
    id: String
}

structure DeleteReviewOutput {}

/// Obtiene el listado de reseñas asociadas a una película específica.
@readonly
@http(method: "GET", uri: "/reviews/movie/{movieId}", code: 200)
operation ListReviewsForMovie {
    input: ListReviewsForMovieInput
    output: ListReviewsForMovieOutput
}

structure ListReviewsForMovieInput {
    @required
    @httpLabel
    movieId: String
}

structure ListReviewsForMovieOutput {
    @required
    reviews: ReviewSummaries
}

list ReviewSummaries {
    member: ReviewSummary
}

structure ReviewSummary {
    @required
    id: String
    @required
    movieId: String
    @required
    author: String
    @required
    rating: Integer
    comment: String
    @required
    createdAt: String
}

/// Error cuando los parámetros de entrada no cumplen las validaciones.
@error("client")
@httpError(400)
structure ValidationException {
    @required
    message: String
}

/// Error cuando la reseña no existe.
@error("client")
@httpError(404)
structure NotFoundException {
    @required
    message: String
}

/// Error cuando la película asignada a la reseña no existe en el catálogo.
@error("client")
@httpError(400)
structure MovieNotFoundException {
    @required
    message: String
}
