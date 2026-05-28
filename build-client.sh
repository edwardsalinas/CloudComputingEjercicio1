#!/bin/bash
set -e

# Store the root directory
ROOT_DIR=$(pwd)

echo "=== 1. Generando el cliente TypeScript de PELÍCULAS (Catálogo) ==="
cd movie-catalog-service
smithy build

echo "=== 2. Aplicando parches de compatibilidad de Windows para el SDK de Películas ==="
cd build/smithy/source/typescript-client-codegen
node -e '
const fs = require("fs");
const path = require("path");
function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
    } else if (full.endsWith(".ts")) {
      let content = fs.readFileSync(full, "utf8");
      let mod = false;
      
      const target1 = "..\\models\\errors";
      const target2 = "..\\models\\MovieCatalogServiceServiceException";
      const target3 = "..\\models\\MovieReviewServiceServiceException";
      
      if (content.includes(target1)) {
        content = content.split(target1).join("../models/errors");
        mod = true;
      }
      if (content.includes(target2)) {
        content = content.split(target2).join("../models/MovieCatalogServiceServiceException");
        mod = true;
      }
      if (content.includes(target3)) {
        content = content.split(target3).join("../models/MovieReviewServiceServiceException");
        mod = true;
      }
      
      if (mod) {
        fs.writeFileSync(full, content, "utf8");
        console.log("Parche aplicado en: " + full);
      }
    }
  });
}
walk("src");
'
echo "=== 3. Compilando el SDK de Películas ==="
npm install
npm run build
cd "$ROOT_DIR"

# ----------------------------------------------------
# CONSTRUCCIÓN DEL CONTRATO DE RESEÑAS
# ----------------------------------------------------
echo ""
echo "=== 4. Generando el cliente TypeScript de RESEÑAS ==="
cd movie-review-service
smithy build

echo "=== 5. Aplicando parches de compatibilidad de Windows para el SDK de Reseñas ==="
cd build/smithy/source/typescript-client-codegen
node -e '
const fs = require("fs");
const path = require("path");
function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
    } else if (full.endsWith(".ts")) {
      let content = fs.readFileSync(full, "utf8");
      let mod = false;
      
      const target1 = "..\\models\\errors";
      const target2 = "..\\models\\MovieCatalogServiceServiceException";
      const target3 = "..\\models\\MovieReviewServiceServiceException";
      
      if (content.includes(target1)) {
        content = content.split(target1).join("../models/errors");
        mod = true;
      }
      if (content.includes(target2)) {
        content = content.split(target2).join("../models/MovieCatalogServiceServiceException");
        mod = true;
      }
      if (content.includes(target3)) {
        content = content.split(target3).join("../models/MovieReviewServiceServiceException");
        mod = true;
      }
      
      if (mod) {
        fs.writeFileSync(full, content, "utf8");
        console.log("Parche aplicado en: " + full);
      }
    }
  });
}
walk("src");
'
echo "=== 6. Compilando el SDK de Reseñas ==="
npm install
npm run build
cd "$ROOT_DIR"

echo ""
echo "=== ¡Ambos clientes Smithy TypeScript generados y compilados con éxito! ==="
