@echo off
title JARVIS AI - Iniciando Sistema
color 0b
echo ===================================================
echo    J.A.R.V.I.S. // STARK OS DESKTOP SYSTEM
echo ===================================================
echo Iniciando modulos y abriendo JARVIS en Windows...
echo.

cd /d "%~dp0"

:: 1. Verificar si node_modules existe, si no, instalar
if not exist "node_modules\" (
    echo [1/2] Primera ejecucion detectada. Instalando dependencias necesarias...
    call npm install
)

:: 2. Iniciar el servidor de fondo de manera silenciosa
start /b "" npx tsx server.ts

:: 3. Esperar 2 segundos para asegurar arranque del servidor
timeout /t 2 /nobreak >nul

:: 4. Abrir la ventana de escritorio nativa de Electron
echo [2/2] Lanzando cabina de JARVIS...
call npx electron electron/main.cjs

exit
