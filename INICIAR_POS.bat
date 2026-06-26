@echo off
TITLE Orquestador POS - Sabor.io
COLOR 0A

echo ===================================================
echo     ENCENDIENDO MOTORES DEL RESTAURANTE POS
echo ===================================================
echo.

:: 1. Entra a la carpeta backend y levanta Node
echo [1/3] Entrando a /backend e iniciando Node.js...
start "Backend POS (NO CERRAR)" cmd /k "cd backend && node server.js"

timeout /t 2 /nobreak >nul

:: 2. Levanta el Frontend de React (parado en la raíz)
echo [2/3] Levantando Interfaz Grafica...
start "Frontend POS" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul

:: 3. Abre Chrome
echo [3/3] Abriendo terminal de venta...
start chrome --app="http://localhost:5173"

exit