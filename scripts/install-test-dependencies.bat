@echo off
echo ===========================================
echo 🚀 vLLM-Doctrine Environment Bootstrapper
echo ===========================================
echo.

REM ===========================================
REM STEP 0: CHECK ADMIN RIGHTS
REM ===========================================
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Not running as Administrator.
    echo    Some installs may fail. Right-click and "Run as Administrator".
    echo.
)

REM ===========================================
REM STEP 1: WINGET DETECTION + VERSION
REM ===========================================
set "WINGET_VERSION="
for /f "tokens=*" %%v in ('winget --version 2^>nul') do set WINGET_VERSION=%%v

if not defined WINGET_VERSION (
    echo ❌ WinGet not found.
    echo 💡 WinGet comes with Windows 11 and recent Windows 10.
    echo    Install from: https://aka.ms/getwinget
    goto TRY_CHOCO
)

echo ✅ WinGet found: %WINGET_VERSION%
echo 🔄 Updating WinGet sources...
winget source update >nul 2>&1
echo.

REM ===========================================
REM STEP 2: NODE.JS INSTALLATION
REM ===========================================
echo 🔍 Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Node.js found: 
    node --version
    goto CHECK_NPM
)

echo ❌ Node.js not found - installing via WinGet...
set RETRIES=0
:INSTALL_NODE
winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
if %errorlevel% neq 0 (
    set /a RETRIES+=1
    if %RETRIES% lss 3 (
        echo ⚠️ Node.js install failed, retrying (%RETRIES%)...
        timeout /t 5 >nul
        goto INSTALL_NODE
    ) else (
        echo ❌ Node.js install failed after 3 attempts.
        goto TRY_CHOCO
    )
)

echo ✅ Node.js installed via WinGet!
goto REFRESH_ENV

:TRY_CHOCO
REM ===========================================
REM STEP 2B: CHOCOLATEY FALLBACK
REM ===========================================
echo 🔍 Checking for Chocolatey...
choco --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Chocolatey found, installing Node.js...
    choco install nodejs-lts -y
    if %errorlevel% equ 0 (
        echo ✅ Node.js installed via Chocolatey!
        goto REFRESH_ENV
    )
) else (
    echo ❌ Chocolatey not found.
    echo 📥 Please install Node.js manually from https://nodejs.org/
    pause
    exit /b 1
)

:REFRESH_ENV
echo 🔄 Refreshing environment variables...
call refreshenv >nul 2>&1
set "PATH=%PATH%;%ProgramFiles%\nodejs;%APPDATA%\npm;%ProgramFiles(x86)%\nodejs"

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js still not available. Restart terminal/IDE and rerun.
    pause
    exit /b 1
)

echo ✅ Node.js is now available:
node --version
echo.

:CHECK_NPM
REM ===========================================
REM STEP 3: NPM CHECK
REM ===========================================
echo 🔍 Checking npm...
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ npm found:
    npm --version
) else (
    echo ❌ npm not found - fixing PATH...
    set "PATH=%PATH%;%APPDATA%\npm;%ProgramFiles%\nodejs;%ProgramFiles(x86)%\nodejs"
    npm --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ npm still not available. Restart terminal/IDE.
        pause
        exit /b 1
    )
    echo ✅ npm is now available:
    npm --version
)
echo.
