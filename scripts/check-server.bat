@echo off
REM Check if vLLM server is running and responding

setlocal enabledelayedexpansion

set PORT=%1
if "!PORT!"=="" set PORT=8500

echo Checking server on http://localhost:!PORT!/health...
echo.

curl -s http://localhost:!PORT!/health >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ Server is running!
    curl -s http://localhost:!PORT!/health
    echo.
) else (
    echo ❌ Server is not responding on port !PORT!
    exit /b 1
)
