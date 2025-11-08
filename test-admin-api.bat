@echo off
echo ========================================
echo  Testing Admin API Endpoints
echo ========================================
echo.

echo Checking if server is running...
curl -s http://localhost:3001/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Server not responding on port 3001
    echo Please start server with: cd server ^&^& npm run dev
    pause
    exit /b 1
)
echo ✓ Server is running

echo.
echo Testing admin health endpoint...
curl -s http://localhost:3001/api/admin/health
echo.

echo.
echo Testing system status endpoint...
curl -s http://localhost:3001/api/admin/system/status
echo.

echo.
echo Testing models status endpoint...
curl -s http://localhost:3001/api/admin/models/status
echo.

echo.
echo Testing mode endpoint...
curl -s http://localhost:3001/api/admin/mode
echo.

echo.
echo ========================================
echo  API Tests Complete
echo ========================================
echo.
echo If you see JSON responses above, the API is working.
echo If you see errors, check server terminal for details.
pause
