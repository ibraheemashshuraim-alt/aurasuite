@echo off
title AuraSuite Jarvis - Background Service Setup
echo ==========================================================
echo  Setting up AuraSuite Jarvis Background Auto-Start...
echo ==========================================================
echo.

set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set TARGET_VBS=%STARTUP_DIR%\AuraSuite_Jarvis_AutoStart.vbs

echo [1/3] Registering Jarvis into Windows Auto-Start...
(
echo Set WshShell = CreateObject("WScript.Shell"^)
echo WshShell.CurrentDirectory = "%~dp0"
echo WshShell.Run "node index.js", 0, False
) > "%TARGET_VBS%"

echo [2/3] Checking Node.js installation...
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not found in PATH!
    pause
    exit /b
)

echo [3/3] Launching Jarvis in the background right now...
wscript "%TARGET_VBS%"

echo.
echo ==========================================================
echo  SUCCESS! Jarvis is now permanently running in background!
echo  - No black command window will stay open.
echo  - Jarvis will automatically start every time Windows boots.
echo  - You can now use AuraSuite on the web anytime!
echo ==========================================================
echo.
timeout /t 4
