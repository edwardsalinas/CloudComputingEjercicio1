# Ejercicio Grupal: Arquitectura Híbrida REST & gRPC en Microservicios

Este proyecto implementa una arquitectura descentralizada de dos microservicios en contenedores Docker que se comunican de forma síncrona a través de **gRPC** en el backend, manteniendo una **API REST** expuesta públicamente al frontend para los clientes. Cada servicio es autónomo y posee su propia persistencia.

---

## 📌 Arquitectura del Sistema

```text
                  +-----------------------------------+
                  |        Cliente / Postman          |
                  +-----------------+-----------------+
                                    |
                            HTTP REST (3002)
                                    |
                                    v
                    +-------------------------------+
                    |   Movie Review Service (M1)   | <---+ [ reviews.db ] (SQLite)
                    |      REST API (Frontend)      |
                    +--------------+----------------+
                                   |
                           gRPC (50051)
                                   |
                                   v
                    +-------------------------------+
                    |  Movie Catalog Service (M2)   | <---+ [ movies.db ] (SQLite)
                    |      gRPC Server (Backend)    |
                    +-------------------------------+
```

### Características Clave:
1. **API Pública REST (Servicio M1 - Reseñas)**: Expone endpoints HTTP REST en el puerto `3002` para interactuar con las reseñas.
2. **Servidor gRPC Privado (Servicio M2 - Catálogo)**: Corre como un backend gRPC puro en el puerto `50051`.
3. **Comunicación Síncrona Inter-servicio**: Al crear o consultar reseñas, el Servicio M1 actúa como un cliente gRPC y realiza llamadas síncronas de alto rendimiento al servidor gRPC de M2 para validar la existencia de películas y enriquecer la información.
4. **Bases de Datos Autónomas**: Cada microservicio administra su propio archivo **SQLite** persistente y montado en el host en la carpeta `data/` respectiva.

---

## 📂 Contratos y Definiciones Protocol Buffers

El comportamiento y los mensajes de la comunicación gRPC están formalmente descritos en el archivo de definición de Protocol Buffers:
* **Definición Proto**: `movie-catalog-service/proto/movie-catalog.proto` -> [Ver Contrato Proto](file:///c:/Users/sterm/OneDrive/Escritorio/Maestria/Maestria/Semana4/ClaseDemo/movie-catalog-service/proto/movie-catalog.proto)

Este archivo se encuentra duplicado en el Servicio M1 para permitir la generación y carga dinámica del cliente gRPC:
* **Copia del Proto en M1**: `movie-review-service/proto/movie-catalog.proto` -> [Ver Proto en Cliente](file:///c:/Users/sterm/OneDrive/Escritorio/Maestria/Maestria/Semana4/ClaseDemo/movie-review-service/proto/movie-catalog.proto)

---

## 🚀 Cómo Ejecutar el Proyecto con Docker Compose

Asegúrate de tener Docker instalado y ejecutándose. Abre una terminal en la raíz del proyecto y ejecuta:

```bash
docker compose down
docker compose up --build -d
```

Esto compilará las imágenes de Node.js (usando `node:20-slim`), descargará e instalará las dependencias necesarias de SQLite de forma aislada, y levantará los servicios en los siguientes puertos locales:
* **Movie Catalog Service (Servicio M2 - Backend gRPC)**: `localhost:50051`
* **Movie Review Service (Servicio M1 - Frontend REST)**: `http://localhost:3002`

---

## 🧪 Métodos de Prueba y Validación

### 1. Pruebas Directas al Backend gRPC (Puerto 50051)

Puedes interactuar directamente con el servidor gRPC usando herramientas cliente gRPC:

#### A. Con `grpcurl` (Línea de Comandos)
* **Listar todas las películas en el catálogo**:
  ```bash
  grpcurl -plaintext -proto movie-catalog-service/proto/movie-catalog.proto localhost:50051 moviecatalog.MovieCatalogService/ListMovies
  ```
* **Obtener una película por ID**:
  ```bash
  grpcurl -plaintext -proto movie-catalog-service/proto/movie-catalog.proto -d '{"id": "1"}' localhost:50051 moviecatalog.MovieCatalogService/GetMovie
  ```

#### B. Con Postman
1. Crea una petición de tipo **gRPC**.
2. Conéctate a `localhost:50051`.
3. Importa el archivo proto `movie-catalog-service/proto/movie-catalog.proto`.
4. Ejecuta cualquiera de los métodos RPC expuestos: `GetMovie`, `ListMovies`, `CreateMovie`, `UpdateMovie`, o `DeleteMovie`.

---

### 2. Pruebas al Frontend REST (Puerto 3002)

El microservicio de reseñas expone endpoints REST tradicionales que internamente realizan llamadas gRPC hacia el backend.

#### A. Crear Reseña de Película INEXISTENTE (Debe Fallar con Error 400 - MovieNotFoundException)
```bash
curl -X POST http://localhost:3002/reviews \
  -H "Content-Type: application/json" \
  -d "{\"movieId\":\"inexistente-id\",\"author\":\"Juan Perez\",\"rating\":4,\"comment\":\"Excelente pelicula.\"}"
```
*Respuesta esperada:* `{"message":"MovieNotFoundException: La película con ID inexistente-id no existe en el catálogo. Reseña rechazada."}`

#### B. Crear Reseña de Película EXISTENTE (ID 1: Inception)
```bash
curl -X POST http://localhost:3002/reviews \
  -H "Content-Type: application/json" \
  -d "{\"movieId\":\"1\",\"author\":\"Carlos G.\",\"rating\":5,\"comment\":\"La mejor pelicula del siglo XXI.\"}"
```

#### C. Obtener Reseña Enriquecida (El servicio REST llama a gRPC en tiempo real)
```bash
curl -X GET http://localhost:3002/reviews/r1
```
*Respuesta esperada (con datos dinámicamente enriquecidos con el título y género traídos desde gRPC):*
```json
{
  "id": "r1",
  "movieId": "1",
  "author": "Alice",
{{ ... }}
}
```

---

### 3. Pruebas con REST Client (VS Code)

Si tienes la extensión **REST Client** de VS Code, puedes abrir el archivo [tests.http](file:///c:/Users/sterm/OneDrive/Escritorio/Maestria/Maestria/Semana4/ClaseDemo/tests.http) y ejecutar las peticiones HTTP del frontend de forma visual e interactiva.
