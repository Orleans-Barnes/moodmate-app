@echo off
set FILE=C:\Users\Orleans Barnes\Downloads\moodmate-app-frontend (3) - Copy\moodmate-app\src\api\client.ts
powershell -Command "(Get-Content '%FILE%') -replace 'http://[0-9.]+:8080', 'http://10.66.41.149:8080' | Set-Content '%FILE%'"
echo.
echo IP updated to 10.66.41.149 in client.ts
pause
