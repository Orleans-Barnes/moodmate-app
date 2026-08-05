# Support Care Experience Redesign

Date: 2026-08-04

## Purpose

Redesign MoodMate's student support, counsellor, and peer mentor surfaces into a modern, calm, lightly gamified care experience. The redesign should feel premium and trustworthy like the supplied appointment references, but remain clearly MoodMate: Calm Forest palette, WhatsApp-inspired chat familiarity, gentle animations, and real backend-backed actions only.

This spec covers the next implementation slice:

- Student support hub and counsellor/peer mentor connection flow.
- Student counsellor profile and scheduling surface.
- Peer mentor profile and connection surface.
- Counsellor dashboard and appointments surface.
- Video/chat entry points around confirmed sessions.
- Calm gamified reward moments tied to healthy actions.

## Current State

The app already has working foundations:

- Student Support lists counsellors and peer mentors.
- Students can book counsellors, reschedule, cancel, message, and join confirmed video sessions.
- Booked slots are fetched from the backend and closed in the UI.
- Counsellors can view, confirm, cancel, complete, and join appointments.
- Student and counsellor chat screens can show a real video action when a confirmed appointment exists.

The visual gap is that the experience currently feels like a functional support hub with inline cards. It does not yet have a dedicated, polished counsellor profile and scheduling flow like the references.

## Design Direction

The references are strongest in three areas: a memorable support-person profile, simple appointment selection, and clear bottom call-to-action. MoodMate should adapt those patterns without becoming a generic doctor, patient, or medical marketplace.

The visual world:

- Calm Forest background, deep teal headers, soft mint panels, warm amber reward accents.
- Rounded cards remain restrained: no nested card stacks, no heavy glass effects.
- Counsellor and peer mentor photos are supported when real image fields/assets exist; otherwise use the current icon/avatar system with richer hero treatment.
- Icons use existing Ionicons/AppIcon conventions.
- Motion is soft: selected date/time pulse, card entrance, confirmation lift, reward leaf shimmer.

## Student Experience

### Support Hub

The Support tab should remain the first screen for students, but become easier to scan:

- Top hero: "Support" with online helpers, unread messages, and next session.
- Next session card: prominent Join/Message buttons when confirmed, and Reschedule/Cancel secondary actions.
- "Find someone" roster: counsellor and peer mentor cards with availability, rating, support focus, and primary action.
- Messages section: WhatsApp-like conversation rows, unread count, and video indicator when a confirmed session exists.

### Counsellor Profile And Booking

When a student taps a counsellor card, open a dedicated profile/booking screen instead of expanding all scheduling inline inside the carousel.

The screen should include:

- Hero block with avatar/photo, name, role/title, rating, availability, and quick actions: message, book, video if a confirmed session exists.
- Trust row: years/experience if available later, rating count, completed sessions if available from backend; otherwise omit unavailable metrics rather than mock them.
- Date picker: seven-day horizontal selector backed by existing date logic.
- Time picker: real backend closed slots using `/api/support/counsellors/{id}/booked-slots`; unavailable times disabled and labelled "Closed".
- Bottom sticky CTA: "Book session" or "Reschedule session", disabled until an open future time is selected.
- Confirmation state: after booking, show a calm success sheet/card with appointment time, Message, and Done.

Peer mentors do not get counsellor-style appointment booking controls unless a future backend model explicitly supports mentor appointments. Their profile action is Request to connect or Message, depending on accepted mentor request state.

## Counsellor Experience

### Dashboard

The counsellor dashboard should feel like a calm workboard:

- Header: greeting, availability toggle, unread/pending/today counts.
- Next session card: student name, time, status, Message, Join if confirmed.
- Pending requests queue: compact cards with Confirm/Decline.
- Recent messages: WhatsApp-like rows.
- Care stats: completion rate, completed sessions, missed/cancelled. Keep analytics secondary and compact.

### Appointments

The appointment screen should be modernized into grouped, scannable sections:

- Segmented filters: All, Pending, Confirmed, Past.
- Date-grouped cards: Today, Tomorrow, Later.
- Confirmed appointment actions: Join Session, Message, Mark Complete, Cancel.
- Pending appointment actions: Confirm, Decline.
- Empty states explain what will appear and keep a clear next action.

## Gamification

Gamification should reward healthy engagement, not pressure users into support-seeking.

Student moments:

- Booking a first support session can award a "Courage Leaf".
- Completing a session can show a soft "You showed up for yourself" reward.
- Journaling after a session can continue the existing XP/journal streak ecosystem.

Counsellor moments:

- Keep gamification professional and understated.
- Use service quality cues such as response streak, completed session count, and "care continuity" indicators.
- Avoid leaderboard, competition, or anything that trivializes care work.

Animation moments:

- Selected time/date gently scales and glows.
- Booking confirmation rises/fades in.
- Reward leaf shimmer lasts under one second and respects the calm tone.

## Data And API Wiring

Use existing real data first:

- `listCounsellors`, `listMentors`.
- `listAppointments`, `bookAppointment`, `rescheduleAppointment`, `cancelAppointment`.
- `listBookedSlots`.
- `startConversation`, `listConversations`.
- `listCounsellorAppointments`, `confirmAppointment`, `completeAppointment`, `cancelAppointmentAsCounsellor`.
- Meeting endpoints for `VideoSession`.

Do not introduce fake counsellor photos, fake peer mentor photos, fake prices, fake student counts, fake patient counts, fake doctor labels, or fake experience metrics. If backend fields do not exist, omit those UI chips or show available real equivalents.

## Error Handling

- If booked slots fail to load, show a retry state and prevent booking rather than allowing a possibly double-booked appointment.
- If a booking/reschedule fails, preserve the user's chosen date/time and show the backend error.
- If video join is outside the backend join window, let `VideoSessionScreen` show the existing real join-window message.
- If mentor request is pending, show "Request sent" disabled.
- All loading states should be local to the action being performed, not whole-screen freezes unless initial data is empty.

## Accessibility And Responsiveness

- Time slots and dates must be accessible buttons with selected/disabled states.
- Text must not overflow on narrow Android screens.
- Sticky CTAs must account for bottom safe area and keyboard.
- No primary action should be hidden under the keyboard.
- Use touch targets of at least 44px.

## Implementation Boundaries

This slice should not:

- Add payments or pricing to counselling.
- Add fake counsellor, peer mentor, patient, or doctor metrics.
- Replace the whole navigation system.
- Rebuild chat internals.
- Add new backend scheduling models unless required by compile/runtime verification.

This slice can:

- Add a `CounsellorDetail` route/screen.
- Refactor duplicated date/time picker UI into shared support components if it reduces risk.
- Polish existing counsellor dashboard and appointment cards.
- Add real gamified reward UI using existing gamification patterns where possible.

## Verification

Before completion:

- Frontend `npm run typecheck`.
- Backend compile if backend route/type changes are made.
- Focused support tests if scheduling logic changes.
- Manual navigation audit by code path: student Support -> counsellor detail -> book -> message -> video; counsellor Dashboard/Appointments -> confirm -> join -> complete.
