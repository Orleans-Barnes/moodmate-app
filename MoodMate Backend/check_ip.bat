@echo off
ipconfig | findstr /i "IPv4" > "%~dp0current_ip.txt"
type "%~dp0current_ip.txt"
pause
