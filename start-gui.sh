#!/bin/bash
# Quick start script for vLLM-Bootstrap GUI
# Date: November 6, 2025

set -e

echo "===================================="
echo "vLLM-Bootstrap GUI Quick Start"
echo "===================================="
echo

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "[1/5] Checking server dependencies..."
if [ ! -d "server/node_modules" ]; then
    echo "Installing server dependencies..."
    cd server
    npm install
    cd ..
else
    echo "Server dependencies already installed."
fi

echo
echo "[2/5] Checking client dependencies..."
if [ ! -d "client/node_modules" ]; then
    echo "Installing client dependencies..."
    cd client
    npm install
    cd ..
else
    echo "Client dependencies already installed."
fi

echo
echo "[3/5] Checking server configuration..."
if [ ! -f "server/.env" ]; then
    echo "Creating server .env from example..."
    cp server/.env.example server/.env
    echo
    echo "WARNING: Using example .env file!"
    echo "Please edit server/.env with your settings before production use."
    echo
else
    echo "Server .env already exists."
fi

echo
echo "[4/5] Starting server..."
cd server
npm run dev &
SERVER_PID=$!
cd ..

# Wait for server to start
sleep 3

echo
echo "[5/5] Starting client..."
cd client
npm run dev &
CLIENT_PID=$!
cd ..

echo
echo "===================================="
echo "Server: http://localhost:3000"
echo "Client: http://localhost:5173"
echo "===================================="
echo
echo "Press Ctrl+C to stop both server and client"

# Trap Ctrl+C and kill both processes
trap "kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit" INT

# Wait for both processes
wait
