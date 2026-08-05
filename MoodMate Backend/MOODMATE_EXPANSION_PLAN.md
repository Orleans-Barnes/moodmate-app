# MoodMate — Expansion & Implementation Plan

**Prepared for:** Orleans Barnes & Team  
**Date:** July 2026  
**Purpose:** Competitive analysis, therapeutic alignment audit, business model, new features, two new games, and a phased implementation roadmap.

---

## SECTION 1 — What the Competition Is Doing

After researching the top mental health and wellness apps in 2026, here is what the market leaders are offering and how MoodMate compares.

### The Big Players

| App | What They Do Well | Monthly Price |
|-----|------------------|---------------|
| **Headspace** | Guided meditation libraries, sleep content, focus music, animated courses | $12.99/mo |
| **Calm** | Sleep stories, breathwork, celebrity meditations, daily "Calm" sessions | $14.99/mo |
| **Wysa** | AI chatbot using 7 clinical frameworks (CBT, DBT, mindfulness, ACT, motivational interviewing, behavioral activation, positive psychology) | $15.99/mo |
| **Sanvello** | CBT-based mood tracking, peer community, optional live coaching | $8.99/mo |
| **BetterHelp** | On-demand licensed therapists via text/video | $60–$100/mo |
| **Woebot** | 24/7 CBT-powered AI chatbot with conversational check-ins | Free (limited) |
| **Youper** | AI therapy + mood tracking + physical health data integration | $9.99/mo |
| **Moodfit** | Mood analytics, thought records, breathing, customisable dashboard | $2.99/mo |
| **Daylio** | Micro mood journal with pattern charts and activity correlation | $4.49/mo |
| **eQuoo** | Evidence-based mental health GAME for university students | $7.99/mo |
| **SuperBetter** | Gamified resilience-building quests for mental and physical health | Free |

### Key Insight

The apps winning in 2026 are the ones that combine **three things**:

1. **Evidence-based therapeutic content** (not just "feel good" quotes)
2. **AI personalisation** (the app learns you and adapts)
3. **Gamification** (keeps users coming back daily)

MoodMate already has all three of these foundations. The opportunity is to deepen each one.

---

## SECTION 2 — Therapeutic Alignment Audit

This section checks MoodMate's current features against established clinical frameworks to make sure the app is responsible, ethical, and genuinely helpful.

### The 7 Recognised Therapeutic Frameworks

| Framework | What It Is | MoodMate Status |
|-----------|-----------|-----------------|
| **CBT** (Cognitive Behavioural Therapy) | Identify and reframe unhelpful thoughts | ⚠️ Partial — AI chat hints at CBT but no structured thought records |
| **DBT** (Dialectical Behaviour Therapy) | Emotion regulation, distress tolerance, mindfulness, interpersonal skills | ⚠️ Partial — Grounding screen exists, but no formal DBT skills module |
| **Mindfulness** | Present-moment awareness, breathing, body scans | ✅ Done — Breathing Session, grounding, check-in emotion wheel |
| **Positive Psychology** | Gratitude, strengths, optimism, flow states | ✅ Done — Gratitude Jar, Wellness Tree, XP system, Proud Dandelion |
| **Behavioural Activation** | Scheduling enjoyable activities to counter low mood | ❌ Missing |
| **ACT** (Acceptance & Commitment Therapy) | Accept difficult feelings instead of fighting them | ❌ Missing — Worry Box is close but not structured |
| **Motivational Interviewing** | Helping users discover their own motivation for change | ❌ Missing |

### Ethical Rules MoodMate Must Follow

Based on guidelines from the American Psychological Association and clinical best practices:

1. **AI Disclaimer** — Every AI chat screen must clearly state: *"I am an AI, not a licensed therapist. This is not medical advice."* This must be prominent, not buried in settings.
2. **Crisis Escalation** — Whenever a user shows signs of crisis, the app must immediately surface the SOS screen and prompt contact with a real professional. MoodMate's crisis detection already does this — keep it.
3. **No Diagnosis Language** — The AI must never say "You have depression" or "You have anxiety." It can say "You seem to be experiencing feelings of..."
4. **Scope Honesty** — The app should position itself as a *supplement* to professional care, not a replacement.
5. **Data Privacy** — Mental health data is extremely sensitive. All data must be stored securely and never sold.

### What MoodMate Gets Right ✅

- SOS screen is always accessible and never gated behind Pro
- AI chat exists for daily emotional support
- Counsellor appointment system connects users to real humans
- Crisis keyword detection in the backend routes users to alerts
- Mood check-in with emotion wheel (evidence-based emotional awareness)
- Habit and sleep tracking (lifestyle factors heavily affect mental health)
- Community with anonymous handles (reduces stigma)
- Gratitude jar and Proud Dandelion (positive psychology, science-backed)
- Breathing exercises with phase cycling (proven parasympathetic response)

### What Needs to Be Fixed or Added ⚠️

1. Add clear AI disclaimer on the chat screen
2. Add structured CBT thought records
3. Add a DBT skills library
4. Add mood pattern charts and analytics
5. Add behavioural activation (activity scheduling)
6. Add a weekly wellness summary/report

---

## SECTION 3 — Business Model

### Recommended Model: Freemium + Student Subscription

Based on how Wysa, Sanvello, and Calm operate, the most sustainable model for a student-focused app is:

#### Free Tier (Always Free)
These features are always available to every user — no paywall, no timer, no limit:
- Mood check-ins (daily)
- Basic journal (up to 10 entries)
- SOS screen and crisis resources
- Breathing exercises (3 guided sessions)
- Gratitude jar (up to 5 entries)
- Community posts (read + post)
- Daily goals (3 goals)
- 1 game (Bubble Pop)
- Basic AI chat (10 messages/day)
- Wellness tree (basic skin)

#### MoodMate Pro — GH₵ 25/month or GH₵ 199/year
Everything in Free, plus:
- **Unlimited** journal entries with all templates
- **Unlimited** AI chat with deeper CBT-guided responses
- **Mood analytics dashboard** — charts, patterns, correlations
- **CBT Thought Records** — structured reframing exercises
- **DBT Skills Library** — distress tolerance, emotion regulation modules
- **Guided meditation audio packs** — themed collections (sleep, focus, exam anxiety, grief)
- **All games** — including two new games
- **Weekly wellness report** — personalised summary sent every Sunday
- **Offline mode** — download meditations and exercises
- **Behavioural Activation planner** — activity scheduling
- **Priority counsellor booking** — skip the queue
- **Custom tree skins** — exclusive Pro skins
- **Ad-free** experience

#### University Group Plan — GH₵ 15/user/month (minimum 10 users)
- For university welfare offices to subscribe on behalf of students
- Admin dashboard for welfare coordinators (anonymous aggregate data only)
- Bulk onboarding via university email domain

### Revenue Projections (Conservative Estimate)

| Scenario | Users | Conversion Rate | Monthly Revenue |
|----------|-------|----------------|-----------------|
| Launch | 500 | 5% | GH₵ 625 |
| 3 months | 2,000 | 8% | GH₵ 4,000 |
| 6 months | 5,000 | 10% | GH₵ 12,500 |
| 12 months | 15,000 | 12% | GH₵ 45,000 |

---

## SECTION 4 — New Features to Implement

### Feature 1 — CBT Thought Record (ThoughtDiary upgrade)

**What it is:** A structured 5-step exercise from Cognitive Behavioural Therapy. When a user feels upset, instead of just writing in a journal, they are guided through a clinical process to understand and reframe their thinking.

**The 5 steps:**
1. **Situation** — What happened? Where were you? Who was there?
2. **Automatic Thought** — What went through your mind immediately?
3. **Emotion** — What did you feel? Rate intensity 0–100%
4. **Evidence Check** — What supports this thought? What argues against it?
5. **Balanced Thought** — What is a more balanced way to see this?

**Where it lives:** Extends the existing `ThoughtDiaryScreen.tsx`
**Who can access:** Pro users only

---

### Feature 2 — DBT Skills Library

**What it is:** A library of DBT (Dialectical Behaviour Therapy) coping skills organised into 4 categories, the same four taught in clinical DBT programmes.

**The 4 modules:**
1. **Mindfulness** — "What" skills (observe, describe, participate) and "How" skills (non-judgementally, one-mindfully, effectively) — guided exercises for each
2. **Distress Tolerance** — TIPP (Temperature, Intense exercise, Paced breathing, Paired muscle relaxation), ACCEPTS distraction techniques, Self-Soothe with 5 senses
3. **Emotion Regulation** — Check the facts, Opposite action, ABC PLEASE (sleep, exercise, substance avoidance, eating, illness)
4. **Interpersonal Effectiveness** — DEAR MAN (Describe, Express, Assert, Reinforce, Mindful, Appear confident, Negotiate) for healthy communication

**Where it lives:** New screen `DBTSkillsScreen.tsx` accessible from Explore tab
**Who can access:** Pro users only

---

### Feature 3 — Mood Analytics Dashboard

**What it is:** Visual charts showing mood patterns over time, like what Daylio and Moodfit are famous for. This turns raw check-in data into useful insight.

**Charts included:**
- 7-day and 30-day mood trend line chart
- Mood vs Sleep correlation (do you feel better when you sleep more?)
- Mood vs Habit completion correlation
- Most frequent emotions pie chart
- Best and worst days of the week bar chart
- Streak calendar heat map (like GitHub contributions)

**Where it lives:** New `MoodAnalyticsScreen.tsx` accessible from Profile or Insights tab
**Who can access:** Basic chart (7 days) free. Full analytics (30 days + correlations) Pro only

---

### Feature 4 — Weekly Wellness Report

**What it is:** Every Sunday evening, the app generates a personalised summary of the user's week — like a mini mental health report card. Inspired by how Wysa and Calm do weekly recaps.

**Report includes:**
- Mood average for the week (emoji + score)
- Streak maintained or broken
- Goals completed vs missed
- Top emotions experienced
- Highlight of the week (e.g. "You journalled 5 days this week — your best streak!")
- One personalised AI tip based on the week's patterns
- Encouragement to book a counsellor if mood was consistently low

**Where it lives:** Push notification + `WeeklyReportScreen.tsx`
**Who can access:** All users (free summary), detailed breakdown Pro only

---

### Feature 5 — Behavioural Activation Planner

**What it is:** A clinical tool from depression treatment. When people feel low, they withdraw from activities, which makes them feel worse. Behavioural Activation breaks this cycle by scheduling enjoyable or meaningful activities.

**How it works:**
1. User picks activities from a list (walk outside, call a friend, cook a meal, listen to music, pray, exercise)
2. Schedules them on a weekly calendar
3. After completing, rates how it made them feel (predicted vs actual mood)
4. App tracks which activities consistently improve mood

**Where it lives:** New `ActivationPlannerScreen.tsx` under Support tab
**Who can access:** Pro users only

---

### Feature 6 — AI Disclaimer & Ethical Guardrails

**What it is:** Non-negotiable ethical additions to the AI chat screen.

**Changes:**
- Banner at top of AI chat: *"MoodMate AI provides emotional support but is not a licensed therapist or medical professional."*
- AI response guardrails: Never say "you have [condition]" — say "you seem to be experiencing..."
- Auto-trigger SOS resources if 3+ crisis keywords detected in one session
- "Talk to a real counsellor" button always visible in AI chat
- AI chat history stored locally (not sent to servers beyond the API call)

---

### Feature 7 — Guided Audio Content Packs (Meditation Library)

**What it is:** Like Headspace and Calm, offer themed audio packs beyond background music. Narrated guided sessions.

**Pack themes:**
- 🌙 **Sleep Pack** — Body scan, progressive muscle relaxation, sleep story
- 📚 **Exam Focus Pack** — Pre-exam calm, focus flow, post-exam wind-down
- 💔 **Heartbreak & Loss Pack** — Grief processing, self-compassion, acceptance
- 😤 **Anger Management Pack** — STOP technique, cooling breath, grounding
- 🌅 **Morning Reset Pack** — Morning intention, energising breath, daily motivation
- 🧘 **Deep Mindfulness Pack** — 10-minute body scan, loving-kindness meditation

**Where it lives:** Explore tab, new `MeditationLibraryScreen.tsx`
**Who can access:** 1 free session per pack, unlimited with Pro

---

## SECTION 5 — Two New Games

### Game 1 — "Thought Sorter" 🧠

**Therapeutic basis:** Cognitive Behavioural Therapy — cognitive restructuring

**Concept:** Thoughts fall slowly from the top of the screen like raindrops. The player must drag each thought into one of two buckets at the bottom — **"Helpful"** (green bucket) or **"Unhelpful"** (red bucket) — before they hit the ground.

**How it teaches CBT:**
- After sorting each thought, the app reveals the reframed version of any unhelpful thought
- Example: *"I always fail at everything"* → sorted as Unhelpful → app shows: *"I have struggled with some things, but I have also succeeded at others"*
- Players earn XP for correct sorts and a "Thought Clarity" score
- Gets faster as levels increase (like Tetris)
- Weekly "Distorted Thinking" report shows which cognitive distortions the player struggles to spot (catastrophising, mind-reading, all-or-nothing thinking)

**Gamification:**
- 5 levels of difficulty
- "Sharpest Mind" weekly leaderboard
- Badges: First Sort, 100 Thoughts Sorted, No Distortions (perfect round)
- Earns Leaf currency on level completion

**Where it lives:** `ThoughtSorterScreen.tsx` in `src/screens/modals/`

---

### Game 2 — "Calm Garden" 🌸

**Therapeutic basis:** Mindfulness + Behavioural Activation + Positive Psychology

**Concept:** The player tends to a personal garden. The garden grows and thrives when the player completes real wellness activities. Neglect it and the garden wilts. It's a metaphor for self-care — you reap what you sow.

**How it works:**
- Each plant in the garden represents a self-care category: Sleep Plant 🌿, Exercise Flower 🌸, Gratitude Tree 🌳, Breathing Fern 🍃, Connection Lily 💐
- To water a plant, the user completes the real activity in MoodMate (e.g. logging sleep waters the Sleep Plant, doing a breathing exercise waters the Breathing Fern)
- Plants have health bars — water them daily and they bloom, miss 3 days and they wilt
- Fully bloomed plants reward with seeds (Leaf currency) to buy new plants and garden decorations
- Garden is beautifully animated — seasons change, butterflies appear when all plants are healthy

**Gamification:**
- Garden expands as you level up (start with 2 plots, unlock up to 10)
- "Full Bloom" achievement when all plants are healthy simultaneously
- Seasonal events — monsoon season (rain gives bonus water), harvest festival (bonus seeds)
- Friends can visit each other's gardens (social feature)
- Rare plants unlocked by completing 7-day streaks

**Where it lives:** `CalmGardenScreen.tsx` in `src/screens/modals/`

---

## SECTION 6 — Implementation Roadmap

The work is divided into 4 phases. Each phase builds on the previous one.

---

### Phase 1 — Foundation & Ethics (Weeks 1–2)

These are the most important changes. Do these first before anything else.

| Task | Why It's First |
|------|---------------|
| Add AI disclaimer banner to chat screen | Ethical requirement — must not wait |
| Add AI response guardrails (no diagnosis language) | Ethical requirement |
| Add "Talk to counsellor" button in AI chat | Safety |
| Upgrade ThoughtDiary to full 5-step CBT Thought Record | High user value, extends existing screen |
| Add mood analytics (7-day chart) to Insights tab | Immediately useful for all users |
| Add clear Pro/Free feature gating in the app | Needed before any monetisation |

**Frontend files to create/edit:**
- Edit `AIChatScreen.tsx` — add disclaimer, guardrails, counsellor button
- Edit `ThoughtDiaryScreen.tsx` — upgrade to 5-step CBT record
- Create `MoodAnalyticsScreen.tsx`
- Edit `InsightsScreen.tsx` — link to analytics
- Edit `ProScreen.tsx` — update Pro features list

**Backend files to create/edit:**
- Edit `AiChatService.java` — add system prompt guardrails, crisis escalation threshold
- Create `MoodAnalyticsController.java` — aggregate mood data endpoints
- Create `MoodAnalyticsService.java` — calculate trends, correlations

---

### Phase 2 — Premium Features (Weeks 3–5)

| Task | Description |
|------|-------------|
| DBT Skills Library | 4-module screen with exercises for each skill |
| Guided Audio Content Packs | 6 themed packs with audio player |
| Behavioural Activation Planner | Weekly calendar + activity mood tracking |
| Weekly Wellness Report | Auto-generated Sunday summary + push notification |
| Pro subscription enforcement | Gate Phase 1 + Phase 2 features behind Paystack subscription |
| Full 30-day mood analytics | Correlation charts (sleep, habits, mood) |

**Frontend files to create:**
- Create `DBTSkillsScreen.tsx`
- Create `MeditationLibraryScreen.tsx`
- Create `ActivationPlannerScreen.tsx`
- Create `WeeklyReportScreen.tsx`
- Edit `ExploreScreen.tsx` — add meditation library entry point
- Edit `SupportScreen.tsx` — add activation planner entry point

**Backend files to create:**
- Create `WellnessReportService.java` — weekly report generation
- Create `WellnessReportController.java`
- Create `ActivationPlan.java`, `ActivationActivity.java` entities
- Create `ActivationController.java`, `ActivationService.java`
- Add Flyway migration `V16__activation_planner.sql`
- Add Flyway migration `V17__wellness_reports.sql`
- Add Flyway migration `V18__dbt_progress.sql`

---

### Phase 3 — New Games (Weeks 6–7)

| Task | Description |
|------|-------------|
| Build Thought Sorter game | CBT thought categorisation game with levels |
| Build Calm Garden game | Mindfulness garden tied to real wellness activities |
| Integrate games with XP system | Completing games awards Leaf currency |
| Add game leaderboards | Weekly leaderboard for Thought Sorter |
| Add game badges | New badges for both games |

**Frontend files to create:**
- Create `ThoughtSorterScreen.tsx` — full game with animations
- Create `CalmGardenScreen.tsx` — garden with animated plants
- Edit `GameScreen.tsx` — update game hub to show all 4 games
- Edit `useGamificationStore.ts` — add game XP and badge types
- Add thought database to `src/data/thoughts.ts` — categorised CBT thought library

**Backend files to create:**
- Create `GameProgressController.java`
- Create `GameProgressService.java`
- Add Flyway migration `V19__game_progress.sql`

---

### Phase 4 — Polish & Growth (Weeks 8–10)

| Task | Description |
|------|-------------|
| Offline mode | Cache meditations and exercises for offline use |
| Social garden visiting | Friends can visit Calm Gardens |
| Mood prediction | AI predicts next-day mood based on patterns |
| University group plan dashboard | Admin view for university welfare offices |
| Onboarding flow improvements | Personalise the app on first launch (goals, focus areas) |
| App Store listing preparation | Screenshots, description, privacy policy |
| Push notification campaigns | Re-engagement nudges for inactive users |

---

## SECTION 7 — Feature Priority Summary

| Priority | Feature | Phase | Access |
|----------|---------|-------|--------|
| 🔴 Critical | AI Disclaimer & Guardrails | 1 | All |
| 🔴 Critical | CBT Thought Records | 1 | Pro |
| 🔴 Critical | Pro/Free gating | 1 | — |
| 🟠 High | Mood Analytics Dashboard | 1–2 | Free (7d) / Pro (30d) |
| 🟠 High | DBT Skills Library | 2 | Pro |
| 🟠 High | Thought Sorter Game | 3 | Pro |
| 🟠 High | Calm Garden Game | 3 | Pro |
| 🟡 Medium | Guided Audio Packs | 2 | Pro |
| 🟡 Medium | Weekly Wellness Report | 2 | All (summary) / Pro (full) |
| 🟡 Medium | Behavioural Activation | 2 | Pro |
| 🟢 Nice to Have | Offline Mode | 4 | Pro |
| 🟢 Nice to Have | Social Garden | 4 | Pro |
| 🟢 Nice to Have | Mood Prediction AI | 4 | Pro |

---

## SECTION 8 — What Makes MoodMate Different

After all this research, here is the honest competitive advantage MoodMate has that other apps don't:

1. **University-specific** — MoodMate is built specifically for Ghanaian university students. Headspace and Calm are Western and generic. MoodMate understands the cultural context — exam stress in Ghana, campus culture, local language nuances, and local currency pricing.

2. **Real counsellor integration** — BetterHelp charges $60–$100/month for therapist access. MoodMate's counsellor system connects students to campus counsellors who may already be part of the university welfare system. This is a huge differentiator.

3. **Gamification depth** — The Wellness Tree with XP, skins, and Leaf currency is more immersive than anything Calm or Sanvello offers. The Calm Garden game (if built well) will be unique in the market.

4. **Price** — At GH₵ 25/month (roughly $2 USD), MoodMate is accessible to university students who cannot afford Headspace ($12.99) or Calm ($14.99).

5. **All-in-one** — Most apps do one thing well. MoodMate already combines mood tracking, journaling, AI chat, counsellor booking, community, games, breathing, habit tracking, and sleep logging in one app.

---

## Ready to Build?

The recommended starting point is **Phase 1** — specifically the AI disclaimer and the CBT Thought Records upgrade. These have the highest impact and lowest risk, and the AI disclaimer is ethically urgent.

When you're ready, say the word and implementation begins.

---

*Sources consulted: Wysa (wysa.com), Headspace (headspace.com), Calm (calm.com), Sanvello (sanvello.com), eQuoo research (PMC10403802), APA Health Advisory on AI chatbots, Cognitive Behaviour Therapy meta-analysis (Carlbring et al.), Startup House Mental Health App Features 2026, WeAreBrain Mental Health Apps 2026.*
