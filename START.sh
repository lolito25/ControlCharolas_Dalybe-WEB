#!/bin/bash

echo "========================================"
echo " SISTEMA DE CONTROL DE CHAROLAS"
echo " Inicio Rápido"
echo "========================================"
echo ""

# Verificar si existe node_modules
if [ ! -d "node_modules" ]; then
    echo "[1/3] Instalando dependencias..."
    npm install
    echo ""
else
    echo "[1/3] Dependencias ya instaladas"
    echo ""
fi

# Verificar si existe .env
if [ ! -f ".env" ]; then
    echo "[2/3] ATENCIÓN: No se encontró archivo .env"
    echo ""
    echo "Por favor, crea un archivo .env con la configuración de tu base de datos."
    echo "Puedes usar .env.example como referencia."
    echo ""
    exit 1
else
    echo "[2/3] Archivo .env encontrado"
    echo ""
fi

echo "[3/3] Iniciando servidor..."
echo ""
echo "========================================"
echo " Servidor iniciado correctamente"
echo " Accede a: http://localhost:3000"
echo "========================================"
echo ""

npm start
