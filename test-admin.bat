@echo off
echo ========================================
echo  Testing Admin System
echo ========================================
echo.

echo [1/2] Testing Server TypeScript...
cd server
call npm run typecheck
if %errorlevel% neq 0 (
    echo ERROR: Server typecheck failed
    pause
    exit /b 1
)
cd ..

echo.
echo [2/2] Testing Client TypeScript...
cd client
call npm run typecheck
if %errorlevel% neq 0 (
    echo ERROR: Client typecheck failed
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo  All Checks Passed!
echo ========================================
echo.
echo Run bootstrap.bat to start the system.
pause
