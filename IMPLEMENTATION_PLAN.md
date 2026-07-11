# MoodMate — Implementation Plan

_Last updated: 2026-07-01_

---

## What is complete

Every item below is fully built, wired frontend ↔ backend, typechecked, and bundled clean.

**Authentication & navigation**
Auth (signup / login / guest / logout), JWT token storage, role-based routing (STUDENT → MainTabs, COUNSELLOR → CounsellorTabs), session auto-resume on app open.

**Journal**
Create, list, view, edit (PUT), delete (DELETE) — fully wired to `POST/GET/PUT/DELETE /api/journal`. Entries load on focus, tapping opens `JournalViewScreen`, deletes trigger an Alert confirmation.

**Gratitude Jar**
Create, list, delete — wired to `POST/GET/DELETE /api/gratitude`. Inline text composer, confetti on save, trash button with Alert on each note.

**Mood Check-in**
Emotion wheel + stress/energy sliders + optional note, wired to `POST /api/checkins`.

**Community**
Anonymous posting + topic filter + 4-reaction system (❤️🙏💪🎉), wired to `POST/GET /api/community` and `POST /api/community/{id}/react`.

**Hub**
Articles (inline expand) + campus events (RSVP/cancel), wired to all `/api/hub/*` endpoints.

**SOS**
Real crisis-line resources from `GET /api/sos/resources`, fail-soft (shows a fallback button if offline).

**Support & Chat (student side)**
Counsellor & mentor listing, appointment booking with day/time picker, conversation list, real-time-ish messaging — wired to all `/api/support/*` student endpoints.

**Support & Chat (counsellor side)**
Appointments (confirm/complete/cancel) + conversation list + chat — wired to all `/api/support/counsellor/*` endpoints.

**Wellness / Goals / Tree**
Daily goals toggle (with streak increment logic), tree XP + stage + skin, wired to `GET /api/wellness/state` and `POST /api/wellness/goals/{key}/toggle`.

**Wallet / Shop**
Leaf balance, transaction history, tree skin equip, wired to `GET/POST /api/wallet/*`. Leaf pack purchases shown as "coming soon" (needs Paystack key).

**Payments / Pro**
Free trial wired to `POST /api/payments/subscription/trial` with a one-trial-ever UI constraint. Real plan prices from `GET /api/payments/plans`. Paid checkout deferred (needs Paystack key + expo-web-browser + app scheme).

**Explore tab**
Ambient soundscapes (6 bundled MP3s via expo-av), daily calm sessions (navigate to BreathingSession with title+duration params), Relax & Reset section (Grounding exercise + daily affirmation + inline stretch timer), Wellness Hub card, Calm Match + Bubble Pop games.

**Breathing Session**
Animated inhale/hold/exhale ring, accepts `{ session, duration }` params so each session type shows the right title and length, 🔊 button plays ocean soundscape via `useAudioPlayer`.

**Bubble Pop** — floating emoji bubbles, tap to pop, score counter, RN Animated only (no new deps).

**Grounding (5-4-3-2-1)** — sensory-anchoring exercise, step-through with tile check-off, completion screen.

**Calm Match** — emoji memory game, shake-on-mismatch, confetti on full clear, +20 XP.

**Profile**
Shows name, avatar emoji, streak, tree level, leaf balance; logout clears token and resets to Login.

---

## What is still missing

Grouped by priority.

---

### Priority 1 — Core gaps that affect every user right now

**P1-A · Mood history screen**
`GET /api/checkins` is built and returns paginated history (emotion, stress, energy, date, note). The Profile screen has a "📊 Wellness history" row that currently just shows a toast. This should open a real `MoodHistoryScreen` showing the last 20 check-ins as a scrollable timeline — emotion emoji + date + stress/energy bars. No new backend work needed.

**P1-B · Profile stats: live journal count**
`ProfileScreen` shows a hardcoded "📓 23". Should read `useJournalStore` entry count (which is already loaded by the time Profile opens).

**P1-C · Edit profile**
`PUT /api/users/me` exists (fullName, institution, avatarEmoji). No UI for it. The "👤 Account" row in Profile just shows a toast. Should open an `EditProfileScreen` with name/institution inputs and an emoji-picker row for the avatar.

**P1-D · Chat polling**
`ChatScreen` and `CounsellorChatScreen` load messages once on mount. If the other party replies, the user sees nothing until they navigate away and back. A simple `setInterval` polling every 8–10 seconds while the screen is focused would fix this with no new dependencies or backend changes.

**P1-E · Admin account bootstrap**
The counsellor approval endpoints (`POST /api/support/counsellor-requests/{id}/approve`) require `hasRole('ADMIN')`. No admin account exists, so no counsellor can ever be approved — meaning no COUNSELLOR-role user can exist. Needs either: (a) a database seed migration that promotes one specific email to ADMIN, or (b) a one-shot SQL command you run manually. Once an admin account exists, Task #8 (admin dashboard) can be addressed properly.

---

### Priority 2 — Important before a real launch

**P2-A · Admin dashboard (Task #8)**
A web UI (or even just documented curl commands) for approving/rejecting counsellor requests. Without this, counsellors can request approval but nobody can grant it. Scope decision: a minimal React web page hosted separately, vs. a screen only visible to ADMIN-role users inside the app.

**P2-B · Paid checkout (Paystack)**
`POST /api/payments/subscription/checkout` and `POST /api/payments/leaf-packs/checkout` are built. Blocked on: (1) a Paystack test secret key in `application.properties`, (2) `expo-web-browser` installed, (3) a deep-link scheme in `app.json` so the return URL resolves back to the app. Once those three things exist, the checkout flow can be wired in a single session.

**P2-C · Rule-based mood insights**
The check-in history from P1-A contains enough signal for simple pattern statements: "You've checked in 5 days in a row 🔥", "Your stress tends to peak mid-week", "Most common mood this week: Anxious". These live entirely on the frontend, need no API key, and give the "AI insights" feel at zero cost. Can be added as a section inside the MoodHistoryScreen or as a separate card on Home.

**P2-D · Community: delete your own post**
The backend has no `DELETE /api/community/{id}` endpoint. Needs to be added server-side (ownership check: can only delete your own post), then wired to a long-press action on the post card.

**P2-E · Password change / forgot password**
No reset or change-password flow exists anywhere. Users who forget their password are permanently locked out. Backend needs a `POST /api/auth/forgot-password` (sends reset email) and `POST /api/auth/reset-password` endpoint; frontend needs a "Forgot password?" link on Login and a reset screen.

---

### Priority 3 — After the above, before wider rollout

**P3-A · Firebase push notifications**
Firebase Cloud Messaging (FCM) so users get alerted when a counsellor replies to their chat, even when the app is closed. Needs: Firebase project + `google-services.json`, `expo-notifications` installed, backend wired to send an FCM push on `POST /api/support/conversations/{id}/messages`. You'd add the Firebase config to a local file — no API key ever shared in chat.

**P3-B · Onboarding flow**
New users land directly on Home with no guidance. A 3-screen swipeable onboarding (shown once, stored in SecureStore) explaining the tree, the journal, and the counsellor feature would significantly improve first-session retention.

**P3-C · Appointment time-slot selection**
The current booking flow uses hand-rolled day/time chips with hardcoded times. Real counsellors have real availability. Backend needs an availability model (`counsellor_availability` table + endpoints); frontend needs a proper time-slot picker that shows only available slots.

**P3-D · Video / audio calls**
The Pro upsell mentions "video calls with counsellors" but no call infrastructure exists. This is a large separate piece (needs a WebRTC provider like Daily.co, Twilio Video, or Jitsi). Scoped as future work.

---

### Deferred / out of scope for now

- Microservices split — current monolith is fine for an MVP; split when there's a specific scaling problem to solve
- Real-time chat via Firebase/WebSocket — the polling approach in P1-D is adequate for now
- Statistics AI (LLM) — rule-based (P2-C) first; upgrade to LLM inference once a free API key is obtained

---

## Recommended build order

```
P1-A  Mood history screen          (frontend only, 1 session)
P1-B  Live journal count in Profile (frontend only, ~30 min)
P1-C  Edit profile screen           (frontend only, 1 session)
P1-D  Chat polling                  (frontend only, ~30 min)
P1-E  Admin bootstrap               (one SQL command or DB migration, ~20 min)
P2-A  Admin dashboard               (decision needed on scope first)
P2-B  Paystack checkout             (needs secret key from you)
P2-C  Rule-based mood insights      (frontend only, 1 session)
P2-D  Community post delete         (backend + frontend, 1 session)
P2-E  Forgot password               (backend + frontend, 1–2 sessions)
P3-A  Firebase push notifications   (needs Firebase project from you)
P3-B  Onboarding                    (frontend only, 1 session)
P3-C  Appointment time slots        (backend + frontend, 2 sessions)
P3-D  Video calls                   (external provider + large integration)
```

Items P1-A through P1-D can be built in the next session with no decisions from you and no new dependencies.
P1-E, P2-B, and P3-A each need something from you first (SQL access, Paystack key, Firebase project).
