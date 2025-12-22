@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Wasla Network System

:: Change to the script's directory
cd /d "%~dp0"

echo.
echo ========================================================
echo           Wasla - Network Management System
echo           Starting...
echo ========================================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please download from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Get local IP address
set IP=localhost
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=*" %%b in ("%%a") do set IP=%%b
    goto :found
)
:found

:: Check if node_modules exist
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
)

if not exist "server\node_modules" (
    echo Installing server dependencies...
    cd server
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to install server dependencies
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo.
)

echo [1/3] Starting server...
cd server
start "" /b cmd /c "node server.js"
cd ..

:: Wait for server to start
echo      Please wait...
timeout /t 3 /nobreak >nul

echo [2/3] Starting frontend...
start "" /b cmd /c "npm run dev -- --host 0.0.0.0"

:: Wait for frontend to start
timeout /t 5 /nobreak >nul

echo [3/3] Opening browser...
start "" http://localhost:5173

echo.
echo ========================================================
echo           System is running!
echo ========================================================
echo.
echo   Local:  http://localhost:5173
echo   Mobile: http://%IP%:5173
echo   Server: http://%IP%:3001
echo.
echo ========================================================
echo      Do not close this window!
echo ========================================================
echo.
echo Press any key to stop...
pause >nul

:: Kill processes
taskkill /f /im node.exe >nul 2>&1
echo System stopped.
