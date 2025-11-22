@echo off
echo ========================================
echo   Lost ^& Found - Web Application
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js is installed!
echo.

echo ========================================
echo   SETUP INSTRUCTIONS
echo ========================================
echo.
echo 1. First, make sure you have run: npm install
echo    in both the web\ and services\ai-question-service\ folders
echo.
echo 2. You need TWO terminal windows:
echo.
echo    TERMINAL 1 - Backend:
echo    cd services\ai-question-service
echo    npm start
echo.
echo    TERMINAL 2 - Frontend:
echo    cd web
echo    npm run dev
echo.
echo 3. The app will open at http://localhost:5173
echo.
echo ========================================
echo.

choice /C YN /M "Do you want to open folders in Explorer"
if %errorlevel%==1 (
    start explorer "web"
    start explorer "services\ai-question-service"
)

echo.
echo Press any key to exit...
pause >nul
