@echo off
REM Quick start script for vLLM-Bootstrap GUI
REM Date: November 6, 2025

echo ====================================
echo vLLM-Bootstrap GUI Quick Start
echo ====================================
echo.

REM Check if node is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/5] Checking server dependencies...
if not exist "server\node_modules" (
    echo Installing server dependencies...
    cd server
    call npm install
    cd ..
) else (
    echo Server dependencies already installed.
)

echo.
echo [2/5] Checking client dependencies...
if not exist "client\node_modules" (
    echo Installing client dependencies...
    cd client
    call npm install
    cd ..
) else (
    echo Client dependencies already installed.
)

echo.
echo [3/5] Checking server configuration...
if not exist "server\.env" (
    echo Creating server .env from example...
    copy server\.env.example server\.env
    echo.
    echo WARNING: Using example .env file!
    echo Please edit server\.env with your settings before production use.
    echo.
) else (
    echo Server .env already exists.
)

echo.
echo [4/5] Starting server...
start "vLLM-Bootstrap Server" cmd /k "cd server && npm run dev"

REM Wait for server to start
timeout /t 5 /nobreak >nul

echo.
echo [5/5] Starting client...
start "vLLM-Bootstrap Client" cmd /k "cd client && npm run dev"

echo.
echo ====================================
echo Server: http://localhost:3000
echo Client: http://localhost:5173
echo ====================================
echo.
echo Two new windows opened:
echo   - Server window (http://localhost:3000)
echo   - Client window (http://localhost:5173)
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo Server and client are running in separate windows.
echo Close those windows to stop the servers.
echo.
pause
exit /b 0
