@echo off
title MoonPelis Launcher
echo =================================================
echo 🎬 Iniciando MoonPelis Streaming Platform
echo =================================================

start "MoonPelis Backend" cmd /k "cd backend && npm run dev"
start "MoonPelis Frontend" cmd /k "cd frontend && npm run dev"

echo Servidor Backend y Cliente Frontend iniciándose...
echo Frontend: http://localhost:5173
echo Backend: http://localhost:3002
