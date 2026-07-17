@echo off
REM Starts every MoodMate microservice, each in its own terminal window, with one command.
REM
REM Prerequisites (this script does not set these up for you):
REM   1. Postgres running locally on 5432, with a database named "moodmate" and a role
REM      "moodmate"/"moodmate" (or set DB_USERNAME/DB_PASSWORD env vars beforehand to match
REM      whatever role you actually use). Each service creates its own schema automatically via
REM      Flyway on first startup (create-schemas: true) - you do not need to create the schemas
REM      yourself.
REM   2. For moodmate-wallet: PAYSTACK_SECRET_KEY and PAYSTACK_PUBLIC_KEY set as real environment
REM      variables in this shell before running this script (never hardcoded into any file).
REM   3. For moodmate-auth: MAIL_USERNAME and MAIL_PASSWORD (Gmail address + app password, no
REM      spaces) - required for forgot-password/reset-password to actually send an email. Auth
REM      still starts fine without these, but that one feature will fail at send-time.
REM   4. For moodmate-ai: GROQ_API_KEY - required for AI chat and the insights narrative. The
REM      service still starts fine without it, but chat/insights requests fail with a clear 503
REM      instead of a confusing one, until it's set.
REM   5. JAVA_HOME pointing at a JDK 17, and this script run from the repo root
REM      (C:\Users\Orleans Barnes\Claude\Projects\MoodMate Backend).
REM
REM Each service opens in its own titled cmd window so you can watch its logs independently and
REM Ctrl+C it individually without taking the others down. Closing this launcher window does NOT
REM stop the services - close each service's own window (or Ctrl+C in it) to stop that one.

setlocal

set ROOT=%~dp0

echo Starting MoodMate microservices...
echo Each service opens in its own window - watch that window for "Started XxxApplication".
echo.

start "moodmate-gateway (8080)"       cmd /k "cd /d "%ROOT%" && mvnw -pl moodmate-gateway spring-boot:run"
start "moodmate-auth (8091)"          cmd /k "cd /d "%ROOT%" && mvnw -pl moodmate-auth spring-boot:run"
start "moodmate-mood (8092)"          cmd /k "cd /d "%ROOT%" && mvnw -pl moodmate-mood spring-boot:run"
start "moodmate-support (8093)"       cmd /k "cd /d "%ROOT%" && mvnw -pl moodmate-support spring-boot:run"
start "moodmate-community (8094)"     cmd /k "cd /d "%ROOT%" && mvnw -pl moodmate-community spring-boot:run"
start "moodmate-wellness (8095)"      cmd /k "cd /d "%ROOT%" && mvnw -pl moodmate-wellness spring-boot:run"
start "moodmate-wallet (8096)"        cmd /k "cd /d "%ROOT%" && mvnw -pl moodmate-wallet spring-boot:run"
start "moodmate-journal (8097)"       cmd /k "cd /d "%ROOT%" && mvnw -pl moodmate-journal spring-boot:run"
start "moodmate-gamification (8098)"  cmd /k "cd /d "%ROOT%" && mvnw -pl moodmate-gamification spring-boot:run"
start "moodmate-admin (8099)"         cmd /k "cd /d "%ROOT%" && mvnw -pl moodmate-admin spring-boot:run"
start "moodmate-crisis (8100)"        cmd /k "cd /d "%ROOT%" && mvnw -pl moodmate-crisis spring-boot:run"
start "moodmate-ai (8101)"            cmd /k "cd /d "%ROOT%" && mvnw -pl moodmate-ai spring-boot:run"

echo.
echo Launched 12 windows. The gateway (http://localhost:8080) is your single entry point -
echo route it to whichever service's /api/** path you need; it forwards to the right port
echo and injects X-User-Id/X-User-Role from the verified JWT.
echo.
echo To stop everything: close each service's window, or Ctrl+C in each one.

endlocal
