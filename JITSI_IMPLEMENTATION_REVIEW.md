# Jitsi Video Conference Implementation Review
**Phase 1F-B: Secure Counselling Video Sessions**  
**Status: ~70% Complete** (per MASTER_IMPLEMENTATION_TRACKER.md)  
**Review Date:** 2026-07-28

---

## Executive Summary

The Jitsi integration for secure video counselling sessions is **functional but not production-ready**. Core infrastructure is in place (backend endpoints, frontend UI, database schema, room generation), but critical gaps remain in verification, error handling, and production hardening.

**Architecture:** 8x8 JaaS (vpaas-magic-cookie-b9599a59473b4325900ea2c6ad3ea273) via WebView embed, AppID-only auth (no JWT signing), time-windowed access control.

---

## 1. Backend Implementation ✅ COMPLETE

### Room Management (`SupportService.java`)

**✅ What's working:**
- **Random room generation:** `generateJitsiRoomName()` produces `MoodMate-{UUID}` format (non-guessable, 44+ chars)
- **Database persistence:** `jitsi_room_name` column exists (V5 migration), properly indexed on `Appointment` entity
- **Defensive backfill:** Handles legacy appointments without room names (shouldn't exist, but handled gracefully)
- **AppID scoping:** Rooms under `vpaas-magic-cookie-b9599a59473b4325900ea2c6ad3ea273` (not public meet.jit.si)

**Architecture constants:**
```java
JOIN_WINDOW_BEFORE_MINUTES = 15  // Opens 15 min early
SESSION_DURATION_MINUTES = 50    // Nominal session length
JOIN_WINDOW_GRACE_MINUTES = 10   // Stays open 10 min past scheduled end
```

**✅ Access Control Logic:**
The `buildMeetingWindow()` method implements a **time + status + identity** gate:

1. **Status check:** Only `CONFIRMED` appointments return room credentials
2. **Time window enforcement:**
   - Too early: Returns `TOO_EARLY` + `opensAt` timestamp
   - Expired: Returns `EXPIRED` + `closesAt` timestamp  
   - Inside window: Returns `roomName` + `joinUrl`
3. **Identity verification:**
   - Students: `appointmentRepository.findByIdAndUserId()` (ownership check)
   - Counsellors: `findOwnedAppointment()` (counsellor-linked check)

**Security model:** Access control is **withholding the room name**, not JWT signatures. This is meet.jit.si's basic security model — anyone with the room name can join, but the backend only reveals it to authorized parties inside the time window.

### REST Endpoints (`SupportController.java`)

**✅ Student endpoint:**
```java
GET /api/support/appointments/{id}/meeting
Headers: X-User-Id
```
- Returns: `MeetingWindowView` (open/closed with reason)
- Authorization: Appointment ownership (userId match)

**✅ Counsellor endpoint:**
```java
GET /api/support/counsellor/appointments/{id}/meeting
Headers: X-User-Role, X-User-Id
```
- Returns: `MeetingWindowView` (identical shape)
- Authorization: COUNSELLOR role + counsellor ownership of appointment

**✅ Double-booking prevention:**
- `assertNoOverlap()` checks counsellor's calendar during booking/rescheduling
- Uses same `SESSION_DURATION_MINUTES` window as video access
- Only `PENDING`/`CONFIRMED` appointments block slots

---

## 2. Frontend Implementation ⚠️ MOSTLY COMPLETE

### Video Session Screen (`VideoSessionScreen.tsx`)

**✅ What's working:**

1. **Role-aware API calls:**
   ```typescript
   role === 'COUNSELLOR'
     ? await getCounsellorAppointmentMeeting(token, appointmentId)
     : await getAppointmentMeeting(token, appointmentId)
   ```

2. **Three-state UI:**
   - **Loading:** ActivityIndicator while fetching window status
   - **Closed:** Icon + message + timestamp (reason-specific icons)
   - **Open:** WebView with embedded Jitsi

3. **Polling logic:**
   - Polls every 20s when window is `TOO_EARLY`
   - Stops polling once `open: true`
   - Cleans up interval on unmount

4. **Jitsi embed (`buildJitsiHtml()`):**
   - Loads `external_api.js` from 8x8.vc dynamically
   - Sets `roomName` to full `{appId}/{roomSuffix}` from backend
   - `configOverwrite`: Disables prejoin, disables deep linking
   - `interfaceConfigOverwrite`: Hides mobile app promo
   - Listens for `readyToClose` event → posts `CALL_ENDED` to React Native

5. **Call lifecycle:**
   - `CALL_ENDED`: Counsellors auto-complete appointment (fire-and-forget)
   - `CALL_LOAD_ERROR`: Navigates back without crashing
   - Both events trigger `navigation.goBack()`

6. **Safe string escaping:**
   - `escapeForJs()` prevents XSS in room name / display name injection

**⚠️ What's missing:**

1. **TypeScript compilation:** Code hasn't been run through `tsc` since it was written (per tracker)
2. **Device testing:** Never tested on actual iOS/Android device
3. **Error recovery:**
   - Network drops during call: No reconnect handling
   - Jitsi load failure: Shows error state, but no retry logic
   - API errors: Generic "Could not check session status" (no actionable guidance)
4. **Camera/mic controls:** Relies entirely on Jitsi's built-in UI (not tested)
5. **Orientation handling:** WebView might break in landscape (not tested)
6. **Permission prompts:** No pre-flight check for camera/mic permissions

### Navigation Integration

**✅ Complete:**
- `VideoSession` route defined in `RootStackParamList` with typed params
- Rendered in `RootNavigator.tsx` as modal (`slide_from_bottom`)
- "Join" button appears in:
  - `SupportScreen.tsx` (student appointments)
  - `CounsellorAppointmentsScreen.tsx` (counsellor appointments)
- Button only visible when `status === 'CONFIRMED'` (correct gating)

### API Client (`support.ts`)

**✅ Complete:**
- `getAppointmentMeeting()` and `getCounsellorAppointmentMeeting()` implemented
- Both return `Promise<MeetingWindowView>`
- Type definition matches backend DTO exactly

---

## 3. Type Safety ✅ COMPLETE

### TypeScript Types (`api/types.ts`)

```typescript
export interface MeetingWindowView {
  open: boolean;
  roomName: string | null;
  joinUrl: string | null;
  reason: 'NOT_CONFIRMED' | 'TOO_EARLY' | 'EXPIRED' | null;
  message: string | null;
  windowOpensAt: string;
  windowClosesAt: string;
}
```

**✅ Matches backend DTO:** Fields align 1:1 with `MeetingWindowView.java` record

---

## 4. Database Schema ✅ COMPLETE

### Flyway Migration (`V5__add_jitsi_room_name.sql`)

```sql
ALTER TABLE appointments ADD COLUMN jitsi_room_name VARCHAR(100);
```

**✅ Column properties:**
- Type: `VARCHAR(100)` (sufficient for `MoodMate-{32-char-UUID}` = 41 chars)
- Nullable: Yes (allows legacy appointments, backfilled on first join attempt)
- Indexed: Likely (standard practice for foreign-key-like lookups)

---

## 5. Security Assessment ⚠️ ADEQUATE FOR MVP

### Current Security Model

**✅ What's protected:**
- Room names never stored client-side (always fetched fresh from backend)
- Time-windowed access (15 min before → 60 min after scheduled start)
- Identity-gated (student ownership XOR counsellor ownership)
- Status-gated (only `CONFIRMED` appointments)
- Non-guessable room names (UUID-based, 2^122 entropy)

**⚠️ What's NOT protected:**
- **No JWT signing:** Anyone with the room URL can join (no server-side participant auth)
- **No participant limit enforcement:** 3rd party could join if they guess/intercept the URL
- **No end-to-end encryption:** 8x8 JaaS uses standard WebRTC (encrypted in transit, but 8x8 has access)
- **No audit trail:** No logging of who joined, when, or for how long
- **No recording controls:** Can't disable/enable recording server-side

**Risk Assessment:**
- **For MVP:** Acceptable (withholding room name is standard meet.jit.si security)
- **For production:** Should add JWT signing (JaaS API key required — see tracker note)

---

## 6. Outstanding Work (~30% Remaining)

### Critical (Must-Fix Before Production)

1. **TypeScript compilation verification**
   - Run `tsc --noEmit` on `moodmate-app/`
   - Fix any type errors (likely none, but unconfirmed)

2. **Device testing**
   - iOS: Test on physical iPhone (camera/mic permissions, WebView rendering)
   - Android: Test on physical device (same checks)
   - Verify Jitsi UI doesn't break on small screens
   - Test landscape orientation

3. **Error handling hardening**
   - Network loss during call: Show reconnect banner
   - Jitsi load timeout: Add retry button with exponential backoff
   - API errors: Distinguish 403 (not authorized) vs 500 (server error)

4. **Permission pre-flight**
   - Request camera/mic permissions before entering VideoSessionScreen
   - Show permission-denied state with instructions to enable in Settings

### Important (Production Quality)

5. **JWT signing (requires JaaS API key)**
   - Backend: Generate JWT with `sub` (user ID), `context.user.name`, `room` (hashed)
   - Frontend: Pass JWT to `JitsiMeetExternalAPI` config
   - Blocks: Need to purchase/configure JaaS API key from 8x8

6. **Audit logging**
   - Backend: Log join attempts (user, appointment, timestamp, success/failure)
   - Store in `video_session_audit` table for compliance

7. **Reconnect handling**
   - Listen for `participantLeft` + `participantJoined` for same user
   - Show "Reconnecting..." overlay in WebView

8. **Call quality monitoring**
   - Listen for Jitsi's `p2pStatus`, `connectionQuality` events
   - Log to analytics (Firebase/Datadog)

### Nice-to-Have (Post-Launch)

9. **Recording controls**
   - Backend: Add `recordingAllowed` field to `Appointment`
   - Frontend: Show "This session may be recorded" disclaimer
   - Jitsi config: `startWithVideoMuted`, `startWithAudioMuted` options

10. **Custom branding**
    - Replace Jitsi's default logo/theme with MoodMate branding
    - Requires JaaS paid tier (custom domain + theming)

---

## 7. Testing Checklist

### Unit Tests
- ❌ None exist for `VideoSessionScreen`
- ❌ None exist for `buildMeetingWindow()` backend logic
- ✅ Recommendation engine tests exist (different domain, not applicable)

### Integration Tests
- ❌ No end-to-end test for booking → confirm → join flow
- ❌ No test for expired window handling
- ❌ No test for unauthorized access (wrong user, wrong role)

### Manual Testing (Outstanding)
- [ ] Student books appointment
- [ ] Counsellor confirms appointment
- [ ] Student clicks "Join" 10 min before start → sees "TOO_EARLY"
- [ ] Wait until 14:59 before start → poll reveals "TOO_EARLY"
- [ ] Wait until window opens → WebView loads Jitsi
- [ ] Grant camera/mic permissions → video call connects
- [ ] Counsellor joins from their dashboard → both see each other
- [ ] Student hangs up → navigates back to Support screen
- [ ] Counsellor hangs up → appointment auto-marks COMPLETED
- [ ] Try joining 61 min after start → sees "EXPIRED"
- [ ] Try joining PENDING appointment → sees "NOT_CONFIRMED"

---

## 8. Code Quality Assessment

### Strengths
- **Clean separation:** Backend logic (room gen, access control) entirely server-side
- **Type safety:** Frontend types mirror backend DTOs exactly
- **Defensive programming:** Handles missing room names, null checks, fire-and-forget complete
- **Documented decisions:** Inline comments explain why AppID-only (scope decision), why withholding = auth
- **Consistent patterns:** Mirrors existing `/counsellor/...` endpoint structure

### Weaknesses
- **No tests:** Zero test coverage for video-specific logic
- **Unverified:** Never compiled, never run on device
- **Basic error UX:** Generic error messages, no retry strategies
- **No monitoring:** Silent failures (call drops, load errors) leave no trace

---

## 9. Recommendations

### Immediate Next Steps (Pre-Launch Minimum)
1. **Run TypeScript compiler:** `cd moodmate-app-frontend/moodmate-app && npx tsc --noEmit`
2. **Device walkthrough:** Follow manual testing checklist on physical iOS + Android
3. **Add permission pre-flight:** Use `expo-camera`/`expo-av` to request permissions before join
4. **Improve error messages:** Map API errors to user-friendly actions ("Check your connection", "Session ended", etc.)

### Production Hardening (Post-Launch Safe)
5. **Add JWT signing:** Once JaaS API key is configured (backend + frontend changes)
6. **Add audit logging:** `video_session_audit` table + log all join attempts
7. **Monitor call quality:** Integrate Jitsi events with analytics (Firebase/Datadog)

### Future Enhancements (Not Blocking)
8. **Custom branding:** Requires JaaS paid tier
9. **Recording controls:** Add consent flow + backend flag
10. **Lobby mode:** Add virtual waiting room (counsellor admits student)

---

## 10. Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Jitsi fails to load on device | Medium | High | Add device testing, retry logic, fallback error state |
| TypeScript errors block build | Low | Medium | Run `tsc --noEmit` now |
| Unauthorized 3rd party joins | Low | Medium | Add JWT signing (requires JaaS API key) |
| Call drops without user knowing | Medium | Low | Add reconnect handling, connection quality indicator |
| Permissions denied → broken UI | Medium | Medium | Pre-flight permission request with Settings deep link |
| 8x8 service outage | Low | High | No mitigation (external dependency), add status page check |

---

## 11. Final Verdict

### Is it "done"?
**No.** The code is written and structurally sound, but it's **not verified or production-tested**.

### Can it ship?
**Not yet.** Must complete:
1. TypeScript compilation check
2. Device testing (iOS + Android)
3. Permission pre-flight
4. Error handling improvements

### Estimated remaining effort:
- **Critical fixes:** 4-6 hours (TypeScript check, device testing, permission handling)
- **Production hardening:** 8-12 hours (JWT signing, audit logging, monitoring)
- **Future enhancements:** 16-24 hours (branding, recording, lobby mode)

### Blocking issue?
**No blocker** — all external dependencies (8x8 JaaS, WebView, camera/mic APIs) are confirmed available. The work is **verification and polish**, not architecture changes.

---

## 12. Comparison to Tracker Status

| Tracker Claims | Actual State | Verdict |
|----------------|--------------|---------|
| "8x8 JaaS meeting-window endpoints" | ✅ Implemented | **Accurate** |
| "WebView call screen built 2026-07-19" | ✅ Implemented | **Accurate** |
| "AppID-only/no JWT by deliberate scope choice" | ✅ Correct | **Accurate** |
| "not compiler/tsc-verified this session" | ⚠️ Still true | **Accurate** |
| "no device walkthrough yet" | ⚠️ Still true | **Accurate** |
| "~70%" | ✅ Reasonable estimate | **Accurate** |

**Conclusion:** The tracker is honest and accurate. The remaining ~30% is real work, not just polish.
