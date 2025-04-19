#!/bin/bash

# Script para iniciar tanto el backend como el frontend

echo "Iniciando el backend..."
./start-backend.sh &
BACKEND_PID=$!

echo "Esperando a que el backend esté disponible..."
sleep 5

echo "Iniciando el frontend..."
./frontend/start-spa.sh &
FRONTEND_PID=$!

echo "Aplicación en marcha!"
echo "- Backend disponible en http://localhost:8000/api"
echo "- Frontend disponible en http://localhost:5000"

# Capturar señales para cerrar limpiamente
trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM

# Esperar a que ambos procesos finalicen
wait