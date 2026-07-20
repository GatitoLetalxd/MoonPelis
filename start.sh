#!/bin/bash

echo "================================================="
echo "🎬 Iniciando MoonPelis Streaming Platform"
echo "================================================="

# Iniciar backend
cd backend
npm run dev &
BACKEND_PID=$!

# Iniciar frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

wait
