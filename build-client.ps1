# PowerShell script to build the Smithy clients locally for both microservices using your installed smithy CLI

$root = Get-Location

Write-Host "=== 1. Generando el cliente TypeScript de PELÍCULAS (Catálogo) ===" -ForegroundColor Cyan
cd movie-catalog-service
smithy build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al ejecutar 'smithy build' en el catálogo." -ForegroundColor Red
    cd $root
    exit $LASTEXITCODE
}

Write-Host "=== 2. Aplicando parches de compatibilidad de Windows para el SDK de Películas ===" -ForegroundColor Cyan
cd build/smithy/source/typescript-client-codegen
Get-ChildItem -Path "src" -Filter "*.ts" -Recurse | ForEach-Object {
    $content = [System.IO.File]::ReadAllText($_.FullName)
    $modified = $false
    
    if ($content.Contains("..\models\errors")) {
        $content = $content.Replace("..\models\errors", "../models/errors")
        $modified = $true
    }
    if ($content.Contains("..\models\MovieCatalogServiceServiceException")) {
        $content = $content.Replace("..\models\MovieCatalogServiceServiceException", "../models/MovieCatalogServiceServiceException")
        $modified = $true
    }
    if ($content.Contains("..\models\MovieReviewServiceServiceException")) {
        $content = $content.Replace("..\models\MovieReviewServiceServiceException", "../models/MovieReviewServiceServiceException")
        $modified = $true
    }
    
    if ($modified) {
        [System.IO.File]::WriteAllText($_.FullName, $content)
        Write-Host "Parche de ruta de Windows aplicado con éxito en: $_" -ForegroundColor Yellow
    }
}

Write-Host "=== 3. Compilando el SDK de Películas ===" -ForegroundColor Cyan
npm install
npm run build
cd $root

# ----------------------------------------------------
# CONSTRUCCIÓN DEL CONTRATO DE RESEÑAS
# ----------------------------------------------------
Write-Host "`n=== 4. Generando el cliente TypeScript de RESEÑAS ===" -ForegroundColor Cyan
cd movie-review-service
smithy build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al ejecutar 'smithy build' en reseñas." -ForegroundColor Red
    cd $root
    exit $LASTEXITCODE
}

Write-Host "=== 5. Aplicando parches de compatibilidad de Windows para el SDK de Reseñas ===" -ForegroundColor Cyan
cd build/smithy/source/typescript-client-codegen
Get-ChildItem -Path "src" -Filter "*.ts" -Recurse | ForEach-Object {
    $content = [System.IO.File]::ReadAllText($_.FullName)
    $modified = $false
    
    if ($content.Contains("..\models\errors")) {
        $content = $content.Replace("..\models\errors", "../models/errors")
        $modified = $true
    }
    if ($content.Contains("..\models\MovieCatalogServiceServiceException")) {
        $content = $content.Replace("..\models\MovieCatalogServiceServiceException", "../models/MovieCatalogServiceServiceException")
        $modified = $true
    }
    if ($content.Contains("..\models\MovieReviewServiceServiceException")) {
        $content = $content.Replace("..\models\MovieReviewServiceServiceException", "../models/MovieReviewServiceServiceException")
        $modified = $true
    }
    
    if ($modified) {
        [System.IO.File]::WriteAllText($_.FullName, $content)
        Write-Host "Parche de ruta de Windows aplicado con éxito en: $_" -ForegroundColor Yellow
    }
}

Write-Host "=== 6. Compilando el SDK de Reseñas ===" -ForegroundColor Cyan
npm install
npm run build
cd $root

Write-Host "`n=== ¡Ambos clientes Smithy TypeScript generados y compilados con éxito! ===" -ForegroundColor Green
