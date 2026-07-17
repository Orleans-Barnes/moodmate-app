@echo off
REM Stops every MoodMate microservice started by start-all.bat, by killing any java.exe process
REM listening on one of the 12 known ports. Safer than a blanket "taskkill java.exe", which would
REM also kill any unrelated Java process you happen to have open (e.g. an IDE's background JDK).

setlocal enabledelayedexpansion

for %%P in (8080 8091 8092 8093 8094 8095 8096 8097 8098 8099 8100 8101) do (
    for /f "tokens=5" %%A in ('netstat -ano ^| findstr ":%%P " ^| findstr "LISTENING"') do (
        echo Stopping process on port %%P (PID %%A)
        taskkill /F /PID %%A >nul 2>&1
    )
)

echo Done. Any leftover cmd windows from start-all.bat can be closed manually.
endlocal
