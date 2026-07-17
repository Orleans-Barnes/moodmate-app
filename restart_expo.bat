@echo off
echo Stopping any running Metro/Expo processes...
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul

echo Opening Expo in Windows Terminal...
wt --title "MoodMate Expo" powershell.exe -NoExit -Command "& '%~dp0run_expo.bat'"
