# MoodMate — Spring Boot Backend

REST API backend for the MoodMate mental wellness mobile app for university students in Ghana.  
Built with **Java 21**, **Spring Boot 3.5**, **PostgreSQL**, and **Flyway**.

---

## Contributors
- [Orleans-Barnes](https://github.com/Orleans-Barnes)
- [kwakuOhene](https://github.com/kwakuOhene)

---

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Java JDK | 21 | https://adoptium.net |
| PostgreSQL | 14+ | https://postgresql.org |
| Git | Any | https://git-scm.com |

> Maven is bundled via `mvnw` — no separate installation needed.

---

## Database Setup

Open **pgAdmin** or **psql** and run:

```sql
CREATE DATABASE moodmate;
CREATE USER moodmate WITH PASSWORD 'moodmate';
GRANT ALL PRIVILEGES ON DATABASE moodmate TO moodmate;
```

Flyway automatically creates all tables on first run — no manual SQL needed.

---

## Environment Setup

Create a file called `start.bat` in the project root (it is already in `.gitignore` so it will never be committed):

```bat
@echo off
set GROQ_API_KEY=your_groq_api_key_here
set MAIL_HOST=smtp.gmail.com
set MAIL_PORT=587
set MAIL_USERNAME=your_gmail@gmail.com
set MAIL_PASSWORD=your_16char_app_password

echo Starting MoodMate backend...
call mvnw.cmd spring-boot:run
```

**How to get a Groq API key:**
Go to https://console.groq.com → API Keys → Create key

**How to get a Gmail App Password:**
1. Go to https://myaccount.google.com/security → enable 2-Step Verification
2. Go to https://myaccount.google.com/apppasswords
3. Create a new app password named "MoodMate Backend"
4. Paste the 16-character code (remove spaces)

**Optional — Paystack (payments):**
- `PAYSTACK_SECRET_KEY` and `PAYSTACK_PUBLIC_KEY` from https://dashboard.paystack.com (test mode keys)
- Without these, all features work except actual payment checkout

---

## Running the Backend

```cmd
start.bat
```

Wait for this line — it means the server is ready:
```
Started MoodMateBackendApplication in X seconds
```

API available at: `http://localhost:8080`

---

## Project Structure

```
src/main/java/com/moodmate/backend/
├── admin/         — Counsellor whitelist management
├── ai/            — Groq AI (LLaMA 3 chat, vision, Whisper audio)
├── auth/          — JWT authentication, signup, login, password reset
├── checkin/       — Mood check-in tracking
├── common/        — Shared exceptions, DTOs, event interfaces
├── community/     — Anonymous community posts & reactions
├── config/        — Security, CORS, JWT, app properties
├── gratitude/     — Gratitude jar entries
├── hub/           — Wellness articles & events
├── journal/       — Personal journal entries
├── payments/      — Paystack subscriptions & leaf packs
├── push/          — Expo push notifications & streak reminders
├── security/      — JWT filter, rate limiting
├── sos/           — Crisis resources (always public, no auth required)
├── support/       — Counsellors, appointments, messaging
├── wallet/        — Leaf currency & tree skins
└── wellness/      — Daily goals & streak tracking

src/main/resources/
├── application.yml          — App config (all secrets via env vars)
└── db/migration/            — Flyway SQL migrations V1 → V15
```

---

## API Overview

All endpoints require a Bearer JWT except:

| Endpoint | Reason |
|----------|--------|
| `/api/auth/**` | Issues the token |
| `/api/sos/**` | Crisis resources — always public |
| `/api/payments/webhook` | Authenticated by Paystack HMAC signature |
| `/actuator/health` | Infrastructure health check |

| Domain | Base Path |
|--------|-----------|
| Auth | `/api/auth` |
| Mood check-ins | `/api/checkins` |
| Wellness & goals | `/api/wellness` |
| Wallet & shop | `/api/wallet` |
| Journal | `/api/journal` |
| Gratitude jar | `/api/gratitude` |
| Community | `/api/community` |
| Support & messaging | `/api/support` |
| Wellness hub | `/api/hub` |
| SOS / crisis | `/api/sos` |
| Payments | `/api/payments` |
| Admin | `/api/admin` |
| AI | `/api/ai` |

---

## Frontend

The React Native frontend is on the `main` branch:

```bash
git checkout main
```

---

## Tech Stack

- Java 21 + Spring Boot 3.5
- Spring Security + JWT (stateless, HS256)
- PostgreSQL + Spring Data JPA + Flyway
- Lombok
- Groq AI (LLaMA 3.1 — chat, vision, Whisper)
- Paystack (payments — test mode)
- Expo Push Notification Service
- JavaMailSender (Gmail SMTP — OTP emails)
