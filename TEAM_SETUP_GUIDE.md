# MoodMate — Team Setup Guide

---

## What you need to install first

| Tool | Download |
|------|----------|
| Git | https://git-scm.com |
| Node.js (version 18+) | https://nodejs.org |
| Java JDK 21 | https://adoptium.net |
| PostgreSQL | https://www.postgresql.org/download |
| Expo Go (on your phone) | Play Store / App Store |

Install all of them, then restart your PC before continuing.

---

## Step 1 — Clone the repo

Open Command Prompt and run:

```cmd
git clone https://github.com/Orleans-Barnes/moodmate-app.git
cd moodmate-app
```

---

## Step 2 — Set up the database (one time only)

Open **pgAdmin** (installed with PostgreSQL), open the Query Tool, and run:

```sql
CREATE DATABASE moodmate;
CREATE USER moodmate WITH PASSWORD 'moodmate';
GRANT ALL PRIVILEGES ON DATABASE moodmate TO moodmate;
```

---

## Step 3 — Set up the backend

```cmd
git checkout backend
```

**Get the `start.bat` file from Orleans** (he will send it to you via WhatsApp or email). Place it inside the `moodmate-app` folder (same level as `pom.xml`).

Then run:

```cmd
start.bat
```

Wait until you see:
```
Started MoodmateBackendApplication in X seconds
```

The backend is now running. **Leave this window open.**

---

## Step 4 — Set up and run the frontend

Open a **new** Command Prompt window and run:

```cmd
cd moodmate-app
git checkout main
npm install
```

Now find your PC's IP address:

```cmd
ipconfig
```

Look for **IPv4 Address** under your Wi-Fi adapter (e.g. `192.168.1.105`).

Open the file `src/config.ts` in any text editor and update the IP:

```ts
export const BACKEND_BASE_URL = 'http://YOUR_IP_HERE:8080';
```

Then start the app:

```cmd
npm start
```

---

## Step 5 — Open on your phone

1. Make sure your phone is on the **same Wi-Fi** as your PC
2. Open **Expo Go** on your phone
3. Scan the **QR code** shown in the terminal

The app will load on your phone.

---

## Common issues

**"Cannot connect to Server"**
→ Your IP may have changed. Re-run `ipconfig` and update `src/config.ts`

**Backend won't start**
→ Make sure PostgreSQL is running (open pgAdmin and check the server is connected)

**Expo Go shows an error**
→ Shake your phone → tap **Reload**

**`npm install` fails**
→ Run `npm cache clean --force` then try again
