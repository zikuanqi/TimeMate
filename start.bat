@echo off
echo Starting AI TimeMate...

REM Check if Python is available
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo Python not found. Please install Python 3.8+ and add to PATH.
    pause
    exit /b 1
)

REM Check if Node is available
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js not found. Please install Node.js 18+ and add to PATH.
    pause
    exit /b 1
)

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
python -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Failed to install backend dependencies.
    pause
    exit /b 1
)

REM Install frontend dependencies
echo Installing frontend dependencies...
cd ..\frontend
npm install
if %errorlevel% neq 0 (
    echo Failed to install frontend dependencies.
    pause
    exit /b 1
)

REM Start both services
echo Starting backend (FastAPI) on http://localhost:8000...
start cmd /k "cd ..\backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak >nul

echo Starting frontend (Vite) on http://localhost:5173...
start cmd /k "cd frontend && npm run dev"

echo.
echo ============================================
echo AI TimeMate is starting up!
echo ============================================
echo Backend API: http://localhost:8000
echo Frontend App: http://localhost:5173
echo.
echo Press Ctrl+C in this window to stop all services.
echo ============================================
echo.

REM Keep window open
pause