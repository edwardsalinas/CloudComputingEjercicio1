# Ejercicio Grupal: Microservicios REST con Contratos Smithy & Docker

Este proyecto implementa una arquitectura descentralizada de dos microservicios en contenedores Docker que se comunican de forma síncrona a través de una API REST. Cada servicio es autónomo y posee su propio contrato de API definido mediante **Smithy 2.0**.

---

## 📌 Arquitectura del Sistema

```text
                  +-----------------------------------+
                  |        Cliente / Postman          |
                  +-----------------+-----------------+
                                    |
            +-----------------------+-----------------------+
            | HTTP (3001)                                   | HTTP (3002)
            v                                               v
+-------------------------+                     +-------------------------+
| Movie Catalog Service   |                     |  Movie Review Service   |
|      (Servicio A)       |                     |      (Servicio B)       |
+-----------+-------------+                     +-----------+-------------+
            |                                               |
            | SQLite                                        | SQLite
            v                                               v
   [  movies.db  ]                                  [  reviews.db  ]
            ^                                               |
            |                                               | Smithy Client
            +----------------- REST (HTTP) -----------------+
                       (Validación y Enriquecimiento)
```

### Características Clave:
1. **Bases de Datos Autónomas**: Cada servicio utiliza su propio motor **SQLite** persistido e independiente.
2. **Validación de Integridad**: Al crear una reseña en el *Servicio B*, éste realiza una consulta en tiempo de ejecución al *Servicio A* para asegurar que el ID de la película sea válido.
3. **Enriquecimiento Dinámico**: Al consultar una reseña en el *Servicio B*, éste solicita en caliente el título y género de la película al *Servicio A* para devolver una respuesta enriquecida al cliente.
4. **Cliente Estilo Smithy**: El Servicio B consume al Servicio A mediante una librería cliente (`src/smithy-client.js`) que replica de forma exacta el patrón de diseño (Commands & Client) del SDK oficial de AWS generado por Smithy.

---

## 📂 Ubicación de los Contratos Smithy

Los contratos son propiedad de cada microservicio y describen formalmente el comportamiento de sus APIs:
* **Contrato del Catálogo**: `movie-catalog-service/contracts/movie-catalog.smithy` -> [Ver Contrato](file:///c:/Users/sterm/OneDrive/Escritorio/Maestria/Maestria/Semana4/ClaseDemo/movie-catalog-service/contracts/movie-catalog.smithy)
* **Contrato de Reseñas**: `movie-review-service/contracts/movie-review.smithy` -> [Ver Contrato](file:///c:/Users/sterm/OneDrive/Escritorio/Maestria/Maestria/Semana4/ClaseDemo/movie-review-service/contracts/movie-review.smithy)

---

## 🚀 Cómo Ejecutar el Proyecto con Docker Compose

Asegúrate de tener Docker instalado y ejecutándose en tu máquina. Luego, abre una terminal en la raíz del proyecto y ejecuta:

```bash
docker compose up --build
```

Esto compilará los contenedores de Node.js, inicializará las bases de datos de SQLite con datos semilla e iniciará los servicios en los siguientes puertos locales:
* **Movie Catalog Service (Servicio A)**: `http://localhost:3001`
* **Movie Review Service (Servicio B)**: `http://localhost:3002`

---

## 🧪 Métodos de Prueba y Validación

### Método 1: Pruebas con cURL (Línea de Comandos)

Puedes utilizar los siguientes comandos `curl` para realizar las pruebas CRUD y de integración directamente en tu terminal.

#### 1. Listar Películas en el Catálogo (Servicio A)
```bash
curl -X GET http://localhost:3001/movies
```

#### 2. Obtener Película por ID (Inception)
```bash
curl -X GET http://localhost:3001/movies/1
```

#### 3. Crear una nueva Película en el Catálogo
```bash
curl -X POST http://localhost:3001/movies \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Interstellar 2\",\"genre\":\"Sci-Fi\",\"director\":\"Christopher Nolan\",\"releaseYear\":2026,\"synopsis\":\"Beyond the wormhole.\"}"
```

#### 4. Crear Reseña de Película INEXISTENTE (Debe Fallar con Error 400 - MovieNotFoundException)
```bash
curl -X POST http://localhost:3002/reviews \
  -H "Content-Type: application/json" \
  -d "{\"movieId\":\"inexistente-id\",\"author\":\"Juan Perez\",\"rating\":4,\"comment\":\"Excelente pelicula.\"}"
```
*Respuesta esperada:* `{"message":"MovieNotFoundException: La película con ID inexistente-id no existe en el catálogo. Reseña rechazada."}`

#### 5. Crear Reseña de Película EXISTENTE (ID 1: Inception)
```bash
curl -X POST http://localhost:3002/reviews \
  -H "Content-Type: application/json" \
  -d "{\"movieId\":\"1\",\"author\":\"Carlos G.\",\"rating\":5,\"comment\":\"La mejor pelicula del siglo XXI.\"}"
```

#### 6. Obtener Reseña Enriquecida (Servicio B consulta a Servicio A en tiempo real)
```bash
curl -X GET http://localhost:3002/reviews/r1
```
*Respuesta esperada (con datos combinados):*
```json
{
  "id": "r1",
  "movieId": "1",
  "author": "Alice",
  "rating": 5,
  "comment": "Absolute masterpiece! Nolan does it again.",
  "createdAt": "2026-05-27T...",
  "movieTitle": "Inception",
  "movieGenre": "Sci-Fi"
}
```

---

### Método 2: Pruebas con REST Client (VS Code)

Si tienes la extensión **REST Client** instalada en VS Code, puedes abrir el archivo [tests.http](file:///c:/Users/sterm/OneDrive/Escritorio/Maestria/Maestria/Semana4/ClaseDemo/tests.http) y hacer clic en `Send Request` sobre cada bloque para probar las llamadas de forma visual e interactiva.

---

### Método 3: Prueba del Cliente Smithy Programático (Node.js Local)

Para probar programáticamente cómo funciona el cliente estructurado al estilo Smithy sin usar CURL o Postman:

1. Instala las dependencias en la carpeta del servicio B para tener `axios` instalado localmente:
   ```bash
   cd movie-review-service && npm install && cd ..
   ```
2. Ejecuta el script de prueba local (asegúrate de que los contenedores docker estén corriendo):
   ```bash
   node client-test.js
   ```
Este script ejecutará un flujo CRUD completo utilizando únicamente comandos de cliente como `client.send(new GetMovieCommand({ id: '1' }))`, validando la compatibilidad de código con el modelo de Smithy.
