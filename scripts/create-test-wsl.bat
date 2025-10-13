@echo off
echo ===============================================
echo 🧪 vLLM-Doctrine WSL Test Environment Creator
echo ===============================================
echo.

REM Check current WSL distributions
echo 🔍 Current WSL distributions:
wsl --list --verbose
echo.

REM Install a fresh Ubuntu instance for testing
echo 🚀 Installing Ubuntu-24.04 for testing...
echo ⏳ This will create a completely fresh environment...
wsl --install Ubuntu-24.04

if %errorlevel% neq 0 (
    echo.
    echo ❌ Installation failed. Trying alternative method...
    echo 📥 Please install manually from Microsoft Store:
    echo    https://aka.ms/wslubuntu2404
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Fresh Ubuntu-24.04 installed!
echo.
echo 📋 Next steps:
echo    1. Launch: wsl -d Ubuntu-24.04
echo    2. Set up username/password when prompted
echo    3. Run the vLLM-Doctrine installation
echo.
echo 💡 Your existing Ubuntu and docker-desktop are untouched!
echo.
pause