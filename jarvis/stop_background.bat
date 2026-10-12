@echo off
title Stop Jarvis Background Service
echo Stopping any running Jarvis daemon instances...
powershell -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*jarvis*index.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force; Write-Host 'Stopped Jarvis process ID' $_.ProcessId }"
echo Jarvis has been stopped.
pause
