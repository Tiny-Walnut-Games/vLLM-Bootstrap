@echo off
setlocal EnableDelayedExpansion

echo ========================================
echo  vLLM-Bootstrap Admin Installer
echo  Tiny Walnut Games
echo ========================================
echo.

set "LOG_FILE=%TEMP%\vllm-bootstrap-install.log"
echo Installation started at %date% %time% > "%LOG_FILE%"

echo [1/5] Checking Node.js installation on Windows...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js not found. Installing via winget...
    echo Installing Node.js... >> "%LOG_FILE%"
    winget install OpenJS.NodeJS.LTS -h --accept-package-agreements --accept-source-agreements
    if %errorlevel% neq 0 (
        echo ERROR: Node.js installation failed. >> "%LOG_FILE%"
        echo ERROR: Failed to install Node.js. Check %LOG_FILE% for details.
        pause
        exit /b 1
    )
    echo Node.js installed successfully. >> "%LOG_FILE%"
    echo Node.js installed. Please restart this script.
    pause
    exit /b 0
) else (
    for /f "tokens=*" %%v in ('node -v 2^>nul') do set NODE_VERSION=%%v
    echo Node.js found: !NODE_VERSION!
    echo Node.js version: !NODE_VERSION! >> "%LOG_FILE%"
)

echo.
echo [2/5] Checking WSL installation...
wsl --status >nul 2>&1
if %errorlevel% neq 0 (
    echo WSL not found. Installing WSL with Ubuntu...
    echo Installing WSL... >> "%LOG_FILE%"
    wsl --install -d Ubuntu --no-launch
    if %errorlevel% neq 0 (
        echo ERROR: WSL installation failed. >> "%LOG_FILE%"
        echo ERROR: Failed to install WSL.
        echo Please run: wsl --install -d Ubuntu
        echo Then restart this script.
        pause
        exit /b 1
    )
    echo WSL installed successfully. >> "%LOG_FILE%"
    echo WSL installed. A system restart may be required.
    echo Please restart Windows if prompted, then run this script again.
    pause
    exit /b 0
) else (
    echo WSL is installed.
    echo WSL status: Installed >> "%LOG_FILE%"
)

echo.
echo [3/5] Setting up WSL path...

setlocal enabledelayedexpansion
set "DRIVE=%CD:~0,1%"
set "RELPATH=%CD:~3%"
set "RELPATH=!RELPATH:\=/!"

REM Convert drive letter to lowercase
if "!DRIVE!"=="E" set "WSLPATH=/mnt/e/!RELPATH!"
if "!DRIVE!"=="C" set "WSLPATH=/mnt/c/!RELPATH!"
if "!DRIVE!"=="D" set "WSLPATH=/mnt/d/!RELPATH!"
if "!DRIVE!"=="F" set "WSLPATH=/mnt/f/!RELPATH!"

echo WSL path: !WSLPATH! >> "%LOG_FILE%"

echo.
echo [4/5] Launching bootstrap within WSL...
echo All setup and GUI startup will now run within WSL environment. >> "%LOG_FILE%"
echo This ensures Python, PyTorch, vLLM, and Node.js servers run in WSL. >> "%LOG_FILE%"
echo.

wsl bash "!WSLPATH!/bootstrap.sh"

if %errorlevel% neq 0 (
    echo ERROR: Bootstrap failed in WSL >> "%LOG_FILE%"
    echo ERROR: WSL bootstrap encountered an error.
    echo Please check the log file: %LOG_FILE%
    pause
    exit /b 1
)

echo.
echo [5/5] Bootstrap complete! GUI is starting...
echo Bootstrap completed successfully at %date% %time% >> "%LOG_FILE%"
echo.
echo Waiting for services to fully start...

echo.
echo Play a notification sound... (either via BurntToast or system sounds)
powershell.exe -Command "(New-Object Media.SoundPlayer 'C:\Windows\Media\Alarm01.wav').PlaySync()
New-BurntToastNotification -Text "vLLM Bootstrap Complete" -Sound Default
echo.

timeout /t 5 /nobreak >nul
echo.
echo ========================================
echo  Installation Complete!
echo ========================================
echo.
echo Admin GUI running in WSL environment.
echo.
echo Access the GUI at: http://localhost:5173
echo.
echo Note: The vLLM server, client, and all Python services are running within WSL.
echo.
echo Log file: %LOG_FILE%
echo.
echo To stop the services, run in WSL:
echo   tmux kill-session -t vllm-bootstrap-server:0
echo   tmux capture-pane -t vllm-bootstrap-server:0 -p -S -50
echo.
pause
