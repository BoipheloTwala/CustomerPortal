@echo off
echo Starting Customer Portal Development Environment
echo ================================================

echo Checking if MongoDB is running...
netstat -ano | findstr :27017 >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: MongoDB does not appear to be running on port 27017
    echo Please start MongoDB first, then run this script again
    pause
    exit /b 1
)

echo MongoDB appears to be running. Starting services...

echo Starting backend server...
start "Customer Portal Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo Starting frontend server...
start "Customer Portal Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Services starting up...
echo Backend will be available at: http://localhost:5000
echo Frontend will be available at: http://localhost:5173
echo.
echo Press any key to exit...
pause >nul
