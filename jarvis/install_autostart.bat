@echo off
title AuraSuite Jarvis - Background Service Setup
echo ==========================================================
echo  Setting up AuraSuite Jarvis Background Auto-Start...
echo ==========================================================
echo.

set "JARVIS_DIR=%~dp0"
if "%JARVIS_DIR:~-1%"=="\" set "JARVIS_DIR=%JARVIS_DIR:~0,-1%"

set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "TARGET_VBS=%STARTUP_DIR%\AuraSuite_Jarvis_AutoStart.vbs"

echo [1/3] Registering Jarvis into Windows Auto-Start...
(
echo Set WshShell = CreateObject("WScript.Shell"^)
echo WshShell.CurrentDirectory = "%JARVIS_DIR%"
echo WshShell.Run """C:\Program Files\nodejs\node.exe"" index.js", 0, False
) > "%TARGET_VBS%"

echo [2/3] Checking Node.js installation...
"C:\Program Files\nodejs\node.exe" -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not found at C:\Program Files\nodejs\node.exe!
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
timeout /t 3
