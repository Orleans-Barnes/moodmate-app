# Support Care Experience Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first production-ready support redesign slice: a dedicated student counsellor profile/booking screen, real slot closure, clearer mentor connection behavior, and verified frontend compilation.

**Architecture:** Keep all data contracts unchanged and call the existing gateway-backed support API. Extract scheduling math into a small helper so booking and reschedule slot availability are consistent and testable, then add a `CounsellorDetail` stack route that consumes existing store/API functions.

**Tech Stack:** Expo React Native SDK 54, TypeScript, React Navigation v7, Zustand, Spring Boot support/auth/admin microservices through the gateway.

## Global Constraints

- The app roles are Students, Counsellors, Peer Mentors, and Admins; never use Doctor/Patient product language.
- Counsellors have scheduled appointments and video sessions; Peer Mentors use request/accept/message, not counsellor-style booking.
- Use real backend data only; do not add fake photos, prices, student counts, or experience metrics.
- Booked slots must come from `GET /api/support/counsellors/{id}/booked-slots`.
- Video entry points must remain tied to confirmed appointments and the existing `VideoSessionScreen` join-window logic.
- Primary verification: `npm run typecheck`; backend compile only if backend contracts change.

---

### Task 1: Scheduling Helper And Test

**Files:**
- Create: `moodmate-app-frontend/moodmate-app/scripts/test-support-scheduling.mjs`
- Create: `moodmate-app-frontend/moodmate-app/src/screens/support/supportScheduling.ts`
- Modify: `moodmate-app-frontend/moodmate-app/src/screens/support/SupportScreen.tsx`

**Interfaces:**
- Produces: `TIME_SLOTS: string[]`, `SESSION_MS: number`, `addDays(date, amount)`, `startOfDay(date)`, `endOfDay(date)`, `slotDateTime(day, slot)`, `isSameDay(a, b)`, `formatTimeLabel(slot)`, `formatApptWhen(iso)`, `isSlotUnavailable(day, slot, bookedSlots, nowMs?)`, `disabledSlotsForDay(day, bookedSlots, nowMs?)`.
- Consumes: frontend `BookedSlotView` shape with `scheduledAt` and `windowEndsAt`.

- [x] **Step 1: Write the failing test**

Create `scripts/test-support-scheduling.mjs` with behavior assertions for overlap, past slots, and formatted labels.

- [x] **Step 2: Run the test to verify it fails**

Run: `node scripts/test-support-scheduling.mjs`

Expected: FAIL because `supportScheduling.ts` does not exist yet.

- [x] **Step 3: Implement the helper**

Move the existing date/time helpers out of `SupportScreen.tsx` into `supportScheduling.ts` and export them.

- [x] **Step 4: Wire SupportScreen to the helper**

Replace the duplicate constants/functions in `SupportScreen.tsx` with imports from `supportScheduling.ts`.

- [x] **Step 5: Run the test and typecheck**

Run: `node scripts/test-support-scheduling.mjs`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

### Task 2: Counsellor Detail Booking Screen

**Files:**
- Create: `moodmate-app-frontend/moodmate-app/src/screens/support/CounsellorDetailScreen.tsx`
- Modify: `moodmate-app-frontend/moodmate-app/src/navigation/types.ts`
- Modify: `moodmate-app-frontend/moodmate-app/src/navigation/RootNavigator.tsx`
- Modify: `moodmate-app-frontend/moodmate-app/src/screens/support/SupportScreen.tsx`

**Interfaces:**
- Consumes: `CounsellorView`, `AppointmentView`, `BookedSlotView`, `useSupportStore.book`, `useSupportStore.openConversation`, `listBookedSlots`.
- Produces: `RootStackParamList['CounsellorDetail'] = { counsellorId: number }`.

- [x] **Step 1: Add route typing and registration**

Add `CounsellorDetail` to `RootStackParamList`, import `CounsellorDetailScreen`, and register it in `RootNavigator`.

- [x] **Step 2: Build the screen**

Use existing store data by `counsellorId`; render hero, rating, specialties, date/time pickers, closed slots, Message, Book, and confirmed-video quick action.

- [x] **Step 3: Wire booking**

Call `listBookedSlots` on focus/date changes, prevent booking when slots fail to load, call `book`, keep selected time after failures, and show a confirmation panel after success.

- [x] **Step 4: Wire messaging and video**

Call `openConversation({ counsellorId })` for Message and navigate `VideoSession` only when a confirmed appointment exists for this counsellor.

- [x] **Step 5: Update SupportScreen roster cards**

Make counsellor card primary action navigate to `CounsellorDetail`; keep peer mentor Request/Message behavior on the card.

- [x] **Step 6: Verify**

Run: `npm run typecheck`

Expected: PASS.

### Task 3: Final Verification

**Files:**
- Review changed frontend files only.

**Interfaces:**
- Consumes: all routes, helpers, and support store paths changed above.
- Produces: tested build state and notes for the user.

- [x] **Step 1: Run frontend checks**

Run: `node scripts/test-support-scheduling.mjs`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

- [x] **Step 2: Run backend compile only if backend files changed**

If backend files are untouched, do not run backend compile for this UI slice.

- [x] **Step 3: Report user test flows**

Provide exact flows: Student Support -> counsellor detail -> book/message/video; Peer Mentor request/message; Counsellor Schedule -> confirm/join/complete.
