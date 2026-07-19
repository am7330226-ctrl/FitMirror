@echo off
echo =========================================
echo       Starting FitMirror Project
echo =========================================

echo.
echo [1/3] Starting Backend Server in a new window...
start "FitMirror Backend" cmd /k "cd backend && npm start"

echo.
echo [2/3] Building Extension...
cd extension
call npm run build
cd ..

echo.
echo [3/3] Launching Chrome with the Extension loaded...
start chrome --load-extension="%~dp0extension\dist"

echo.
echo Done! You can close this window.
