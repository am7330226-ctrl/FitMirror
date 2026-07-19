@echo off
echo =========================================
echo       Starting FitMirror Dev Servers
echo =========================================

echo.
echo [1/2] Starting Backend Server in a new window...
start "FitMirror Backend" cmd /k "cd backend && npm start"

echo.
echo [2/2] Starting Extension Dev Server in a new window...
start "FitMirror Extension Dev" cmd /k "cd extension && npm run dev"

echo.
echo Dev servers are running in separate windows!
