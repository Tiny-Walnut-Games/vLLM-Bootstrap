@echo off
REM Start vLLM model in a new terminal window
REM Usage: start-model.bat {fast|edit|qa|plan}

setlocal enabledelayedexpansion

if "%1"=="" (
    echo Usage: start-model.bat {fast^|edit^|qa^|plan}
    exit /b 1
)

set MODEL_ROLE=%1

REM Check if bash is available
where bash >nul 2>&1
if errorlevel 1 (
    echo Error: bash not found. Please install Git Bash or WSL.
    exit /b 1
)

REM Open new terminal and run the script
start "vLLM Bootstrap - %MODEL_ROLE%" bash -c "cd %~dp0 && bash daily-bootstrap.sh %MODEL_ROLE% ; read -p 'Press enter to close...'"

echo.
echo Model launched in new terminal window.
echo To check server health:
echo   curl http://localhost:8500/health
echo.
