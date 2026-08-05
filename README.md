# MoodMate — React Native Frontend

AI-powered mental wellness mobile app for university students in Ghana.  
Built with **React Native**, **Expo SDK 54**, **TypeScript**, and **Spring Boot** (backend).

---

## Contributors
- [Orleans-Barnes](https://github.com/Orleans-Barnes)
- [kwakuOhene](https://github.com/kwakuOhene)
- [Isaac-kusi]
- (https://github.com/Isa123at)
---

## Prerequisites

Make sure you have these installed before you start:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18 or higher | https://nodejs.org |
| Git | Any | https://git-scm.com |
| Expo Go (phone) | Latest | Play Store / App Store |

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Orleans-Barnes/moodmate-app.git
cd moodmate-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Update the backend IP address

Open `src/config.ts` and replace the IP with your teammate's PC IP address:

```ts
export const BACKEND_BASE_URL = 'http://YOUR_PC_IP:8080';
```

**How to find your IP (Windows):**
1. Open Command Prompt
2. Run: `ipconfig`
3. Find **IPv4 Address** under your Wi-Fi adapter
4. Replace `YOUR_PC_IP` with that address (e.g. `192.168.1.105`)

> ⚠️ This IP changes every time you reconnect to Wi-Fi. Always check it first if the app can't connect.

### 4. Start the backend first

The backend must be running before you launch the app.  
See the `backend` branch for backend setup instructions.

### 5. Run the app

```bash
npm start
```

Then:
- Install **Expo Go** on your Android phone
- Scan the **QR code** shown in the terminal
- Make sure your phone and PC are on the **same Wi-Fi network**

---

## Project Structure

```
moodmate-app/
├── App.tsx                  # App entry point & navigation setup
├── src/
│   ├── api/                 # All backend API calls
│   ├── components/          # Reusable UI components
│   ├── navigation/          # React Navigation stack & tab config
│   ├── screens/             # All app screens organised by feature
│   │   ├── admin/           # Admin dashboard
│   │   ├── auth/            # Login, Signup, Forgot Password
│   │   ├── counsellor/      # Counsellor portal screens
│   │   ├── home/            # Home screen
│   │   ├── insights/        # AI chat & insights
│   │   ├── journal/         # Journal entries
│   │   ├── modals/          # Breathing, games, profile, etc.
│   │   └── support/         # Student-counsellor messaging
│   ├── state/               # Zustand global state stores
│   ├── theme/               # Design tokens (colors, fonts, spacing)
│   └── config.ts            # Backend URL — update this with your IP
├── assets/
│   ├── music/               # Background music tracks
│   └── sounds/              # Sound effects
└── package.json
```

---

## User Roles

| Role | Access |
|------|--------|
| **Student** | Home, Journal, Community, Explore, Support, AI Chat |
| **Counsellor** | Dashboard, Appointments, Messaging (whitelisted by admin) |
| **Admin** | User management, Counsellor whitelist, Platform stats |

---

## Common Issues

**"Cannot connect to Server"**  
→ Check your IP in `src/config.ts` matches your current PC IP (`ipconfig`)  
→ Make sure the backend (`start.bat`) is running  
→ Ensure your phone and PC are on the same Wi-Fi  

**App not loading after `npm start`**  
→ Run `npm install` again  
→ Clear Expo cache: `npx expo start --clear`  

**Expo Go shows blank screen**  
→ Shake your phone → Reload  

---

## Backend

The Spring Boot backend lives on the `backend` branch of this repo.  
Switch to it for backend setup:

```bash
git checkout backend
```

---

## Tech Stack

- React Native 0.81.5
- Expo SDK 54
- TypeScript 5.7
- React Navigation 7
- Zustand (state management)
- Expo SecureStore (token storage)
- Expo Notifications (push notifications)
- Supabase (real-time messaging fallback)
- Groq AI (LLaMA 3 — AI chat & insights)
