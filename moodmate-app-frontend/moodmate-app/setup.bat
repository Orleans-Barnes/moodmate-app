@echo off
echo ==========================================
echo  MoodMate Frontend — Setup
echo ==========================================

echo.
echo [1/3] Installing npm packages...
npm install

echo.
echo [2/3] Checking Quicksand fonts...
if not exist "assets\fonts\Quicksand-Bold.ttf" (
  echo.
  echo  *** ACTION REQUIRED ***
  echo  Download Quicksand fonts from:
  echo  https://fonts.google.com/specimen/Quicksand
  echo  Place these files in assets\fonts\:
  echo    Quicksand-Light.ttf
  echo    Quicksand-Regular.ttf
  echo    Quicksand-Medium.ttf
  echo    Quicksand-SemiBold.ttf
  echo    Quicksand-Bold.ttf
  echo.
) else (
  echo  Fonts found!
)

echo.
echo [3/3] Ready to start!
echo  Run: npx expo start
echo ==========================================
