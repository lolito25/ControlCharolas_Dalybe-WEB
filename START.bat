@echo off
echo ========================================
echo  SISTEMA DE CONTROL DE CHAROLAS
echo  Inicio Rapido
echo ========================================
echo.

REM Verificar si existe node_modules
if not exist "node_modules\" (
    echo [1/3] Instalando dependencias...
    call npm install
    echo.
) else (
    echo [1/3] Dependencias ya instaladas
    echo.
)

REM Verificar si existe .env
if not exist ".env" (
    echo [2/3] ATENCION: No se encontro archivo .env
    echo.
    echo Por favor, crea un archivo .env con la configuracion de tu base de datos.
    echo Puedes usar .env.example como referencia.
    echo.
    pause
    exit /b 1
) else (
    echo [2/3] Archivo .env encontrado
    echo.
)

echo [3/3] Iniciando servidor...
echo.
echo ========================================
echo  Servidor iniciado correctamente
echo  Accede a: http://localhost:3000
echo ========================================
echo.

npm start
