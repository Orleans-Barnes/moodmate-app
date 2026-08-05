# MoodMate App — Setup Guide for the Team

Hey team! 👋 Welcome to the MoodMate project. This guide will walk you through everything you need to do to get the app running on your computer and phone. Take it one step at a time — don't rush, and don't skip any step.

If you get stuck at any point, reach out to Orleans.

---

## Before We Start — What Are We Setting Up?

The MoodMate project has two parts:

- **The Backend** — This is like the engine of the app. It runs on your computer in the background and handles things like storing data, logging in users, and connecting to AI. Think of it as the kitchen in a restaurant — users don't see it, but nothing works without it.

- **The Frontend** — This is the actual app you see and use on your phone. It connects to the backend to get data and display it.

You need **both** running at the same time for the app to work.

---

## PART 1 — Install the Required Tools

You only need to do this once. These are the tools our project needs to run.

---

### Tool 1 — Git (for downloading the project)

Git is what lets you download ("clone") the project from GitHub onto your computer.

1. Go to: **https://git-scm.com/downloads**
2. Click the download button for your operating system (Windows/Mac)
3. Open the downloaded file and click **Next** through all the steps (the default settings are fine)
4. When it's done, open **Command Prompt** (on Windows, press the Windows key, type `cmd`, and press Enter)
5. Type this and press Enter:
   ```
   git --version
   ```
   If you see something like `git version 2.x.x` — Git is installed ✅

---

### Tool 2 — Node.js (for running the frontend)

Node.js lets your computer run the frontend app code.

1. Go to: **https://nodejs.org**
2. Click the big green button that says **"LTS"** (this is the stable version)
3. Open the downloaded file and click **Next** through all the steps
4. When it's done, open a **new** Command Prompt window and type:
   ```
   node --version
   ```
   If you see something like `v18.x.x` or `v20.x.x` — Node.js is installed ✅

---

### Tool 3 — Java JDK 21 (for running the backend)

Java is what runs the backend engine of the app. Make sure you install **version 21** specifically — other versions will not work.

1. Go to: **https://adoptium.net**
2. You will see a table with different versions. Click the one that says **Temurin 21 (LTS)**
3. Download the installer for your operating system
4. Open the downloaded file and click **Next** through all the steps
5. When it's done, **restart your computer**
6. After restarting, open Command Prompt and type:
   ```
   java -version
   ```
   If you see something like `openjdk version "21.x.x"` — Java is installed ✅

> ⚠️ If it shows version 17 or 11 or anything other than 21, you need to uninstall that version and install 21 from the link above.

---

### Tool 4 — PostgreSQL (the database for the backend)

PostgreSQL is the database where the app stores all its data — user accounts, journal entries, mood check-ins, everything.

1. Go to: **https://www.postgresql.org/download**
2. Click on your operating system
3. Download and open the installer
4. Click **Next** through the steps. When it asks you to set a **password**, use:
   ```
   moodmate
   ```
   ⚠️ Write this password down. You'll need it.
5. Leave the port as **5432** (the default)
6. Finish the installation
7. After installing, search for **pgAdmin 4** on your computer and open it. If it opens without errors — PostgreSQL is installed ✅

---

### Tool 5 — Expo Go (on your phone)

This is the app on your phone that will run the MoodMate frontend.

- **Android:** Open the Play Store and search for **"Expo Go"** → Install it
- **iPhone:** Open the App Store and search for **"Expo Go"** → Install it

---

## PART 2 — Download the Project

Now that all your tools are installed, let's get the project onto your computer.

1. Open **Command Prompt**
2. Decide where you want to save the project. For example, your Desktop. Type this to go to your Desktop:
   ```
   cd Desktop
   ```
3. Now download the project by typing:
   ```
   git clone https://github.com/Orleans-Barnes/moodmate-app.git
   ```
4. Wait for it to finish. When it's done, a new folder called `moodmate-app` will appear on your Desktop.
5. Go into that folder:
   ```
   cd moodmate-app
   ```

You now have the project on your computer. 

---

## PART 3 — Set Up the Database

The backend needs a database to store data. We need to create it. This is a one-time setup.

1. Open **pgAdmin 4** on your computer (search for it in your Start menu)
2. It will ask you for the master password — enter `moodmate` (what you set during installation)
3. On the left side, expand **Servers** → expand **PostgreSQL 14** (or whichever version you have)
4. Right-click on **Databases** → click **Create** → click **Database**
5. In the **Database** box, type: `moodmate`
6. Click **Save**

Then we need to create a database user:

7. At the top of pgAdmin, click **Tools** → click **Query Tool**
8. A text box will appear. Copy and paste these three lines into it:
   ```sql
   CREATE USER moodmate WITH PASSWORD 'moodmate';
   GRANT ALL PRIVILEGES ON DATABASE moodmate TO moodmate;
   ```
9. Press the **▶ Play** button (or press F5) to run it
10. You should see a message saying the query ran successfully ✅

---

## PART 4 — Set Up and Run the Backend

### Step 1 — Switch to the backend branch

The project has two separate branches (versions). The backend code is on a branch called `backend`. Switch to it now:

```
git checkout backend
```

You should see: `Switched to branch 'backend'`

### Step 2 — Get the start.bat file from Orleans

The backend needs some secret keys (API keys) to work. These are kept in a file called `start.bat`. Orleans will send this file to you directly via WhatsApp or email.

Once you receive it:
- Place the `start.bat` file inside the `moodmate-app` folder (the same folder where you can see files like `pom.xml` and `mvnw.cmd`)

### Step 3 — Run the backend

In your Command Prompt (make sure you're inside the `moodmate-app` folder), type:

```
start.bat
```

You will see a lot of text scrolling on the screen. This is normal — the backend is starting up. **Wait for it.**

After about 30–60 seconds, look for a line that says:

```
Started MoodmateBackendApplication in X seconds
```

When you see that line — **the backend is running** ✅

> ⚠️ Do NOT close this Command Prompt window. The backend stops if you close it. Keep it open in the background while you use the app.

---

## PART 5 — Set Up and Run the Frontend

Open a **brand new** Command Prompt window (don't close the one running the backend).

### Step 1 — Switch to the frontend branch

```
cd Desktop\moodmate-app
git checkout main
```

### Step 2 — Install the frontend packages

```
npm install
```

This downloads all the code libraries the frontend needs. It may take 2–5 minutes. Wait for it to finish.

### Step 3 — Find your computer's IP address

Your phone needs to know where to find the backend running on your computer. We do this using your IP address.

In Command Prompt, type:

```
ipconfig
```

You will see a list of information. Look for the section called **"Wireless LAN adapter Wi-Fi"** and find the line that says **IPv4 Address**. It will look something like:

```
IPv4 Address. . . . . . . . . . . : 192.168.1.105
```

Copy that number (yours will be different).

> ⚠️ Make sure your phone is connected to the **same Wi-Fi network** as your computer. If your phone is on mobile data or a different Wi-Fi, it won't work.

### Step 4 — Update the IP address in the project

1. Open the `moodmate-app` folder on your Desktop
2. Go into the `src` folder
3. Open the file called `config.ts` with any text editor (Notepad, VS Code, etc.)
4. You will see a line like this:
   ```
   export const BACKEND_BASE_URL = 'http://10.91.36.149:8080';
   ```
5. Replace the numbers between `http://` and `:8080` with **your** IP address:
   ```
   export const BACKEND_BASE_URL = 'http://192.168.1.105:8080';
   ```
   (Use your own IP, not this example)
6. Save the file

### Step 5 — Start the frontend

```
npm start
```

A QR code will appear in the terminal.

---

## PART 6 — Open the App on Your Phone

1. Open **Expo Go** on your phone
2. Tap **"Scan QR code"**
3. Point your camera at the QR code on your computer screen
4. The MoodMate app will load on your phone 🎉

---

## ⚠️ Important Things to Remember

**Every time you want to use the app:**
1. Open Command Prompt → go to the `moodmate-app` folder → switch to `backend` branch → run `start.bat` → wait for it to start
2. Open a second Command Prompt → go to `moodmate-app` → switch to `main` branch → run `npm start`
3. Scan the QR code with Expo Go

**If the app says "Cannot connect to Server":**
Your IP address probably changed (this happens when you reconnect to Wi-Fi). Just run `ipconfig` again, check if the IP is different, and update `src/config.ts` with the new one.

**Never close the backend window while using the app.**
If you accidentally close it, just open Command Prompt again and run `start.bat` again.

---

## Quick Checklist

Use this to make sure you haven't missed anything:

- [ ] Git installed
- [ ] Node.js installed  
- [ ] Java JDK 21 installed
- [ ] PostgreSQL installed and database created
- [ ] Expo Go installed on phone
- [ ] Project cloned from GitHub
- [ ] `start.bat` file received from Orleans and placed in project folder
- [ ] Backend running (shows "Started MoodmateBackendApplication")
- [ ] IP address updated in `src/config.ts`
- [ ] Frontend running (`npm start`)
- [ ] App loaded on phone via Expo Go

---

If anything is not working, message Orleans and tell him exactly what step you are on and what message you see on your screen. 

Good luck! 💪
