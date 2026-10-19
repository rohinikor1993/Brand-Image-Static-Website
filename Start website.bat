@echo off
setlocal
title Brand Image website - local preview
cd /d "%~dp0"

echo.
echo   Starting the Brand Image website on this computer...
echo.

where node >nul 2>nul
if errorlevel 1 goto powershell

node "src\serve.js" 3000 --open
goto end

:powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0src\serve.ps1" -Port 3000

:end
echo.
echo   The website preview has stopped.
pause
