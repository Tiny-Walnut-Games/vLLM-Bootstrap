@echo off
echo ==============================================
echo 🧹 vLLM-Doctrine Test Environment Cleanup
echo ==============================================
echo.

echo 🔍 Current WSL distributions:
wsl --list --verbose
echo.

echo ⚠️  This will COMPLETELY REMOVE the Ubuntu-24.04 test environment!
echo    Your original Ubuntu and docker-desktop will remain untouched.
echo.
set /p confirm=Type 'YES' to confirm deletion: 

if /i not "%confirm%"=="YES" (
    echo ❌ Cleanup cancelled.
    pause
    exit /b 0
)

echo.
echo 🛑 Terminating Ubuntu-24.04...
wsl --terminate Ubuntu-24.04

echo 🗑️  Unregistering Ubuntu-24.04...
wsl --unregister Ubuntu-24.04

if %errorlevel% equ 0 (
    echo ✅ Ubuntu-24.04 test environment removed successfully!
    echo 💾 Your original environments are safe.
) else (
    echo ❌ Error during cleanup. Check manually with: wsl --list
)

echo.
pause