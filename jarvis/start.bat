@echo off
echo Starting AuraSuite Jarvis Daemon...
echo Checking for Node.js...
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed! Please download and install it from https://nodejs.org/
    pause
    exit /b
)
echo Node.js is installed. Installing packages...
call npm install
echo Starting Jarvis...
node index.js
pause
