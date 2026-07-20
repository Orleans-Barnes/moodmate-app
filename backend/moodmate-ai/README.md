# moodmate-ai

No monolith counterpart - new service, added because the frontend already shipped full AI chat
(`src/api/aiChat.ts`) and insights (`src/api/insights.ts`) UIs with zero backend behind either.

## What it owns

One table, `ai_chat_messages` (full conversation history per user).

## AI chat (`/api/ai/chat`)

Text only for now - `audioBase64`/`imageBase64` fields the frontend can send are rejected with a
clear 400 ("Voice and photo messages aren't supported yet") rather than silently ignored, since no
speech-to-text or vision API credentials were available when this was built (only a Groq **text**
key). See `AiChatService`'s doc comment for how to extend this later.

Backed by `AiModelRouter` - dual-model routing between Groq (OpenAI-compatible chat completions,
default primary) and Gemini (`generateContent`, default secondary/automatic fallback). If the
primary model's call fails for any reason (timeout, 5xx, missing key, empty response), the router
automatically retries once on the other model before giving up - a single provider outage no
longer takes down chat or insights entirely. Pro users can additionally set
`AiChatRequest.preferredModel` (`"groq"` | `"gemini"`) to choose which one is tried first for a
given message; free-tier requests ignore this field server-side. Model is `GROQ_MODEL` (default
`llama-3.3-70b-versatile`) / `GEMINI_MODEL` (default `gemini-2.0-flash`) - both providers' model
lineups change over time; if requests start failing, check
https://console.groq.com/docs/models / https://ai.google.dev/gemini-api/docs/models and override
the env var rather than hardcoding a new default. See `AiModelRouter`'s doc comment for the full
failover/preference logic.

Every user message (not the AI's replies) is scanned by `CrisisKeywordDetector` - a plain
substring/keyword heuristic, **not** a clinical tool - before being sent to either model. A match
files an alert with moodmate-crisis (`POST /internal/crisis/alerts`, source `AI_CHAT`) for a
counsellor to review; a failure to file that alert is logged but never blocks the chat reply itself
from reaching the student.

## Insights (`/api/insights`)

`wellnessScore` (0-100) and `sentimentScore` (-100 to 100) are computed deterministically from
mood-service's last 30 days of check-ins (stress/energy/emotion) - no LLM involved, so they're
fast and reproducible. Only `narrativeSummary` is AI-generated, via the same `AiModelRouter`; if
BOTH configured models are unavailable, it falls back to a templated sentence built from the same
stats instead of failing the whole request.

Reads mood-service's new `GET /internal/mood/{userId}/trend` (added alongside this service) -
deliberately does NOT read journal-service, to avoid this service needing broad access into
private journal entries just to compute a score.

## Required environment variables

```
GROQ_API_KEY=<your key>              # primary model - chat/insights fail over to Gemini if unset/failing
GROQ_MODEL=llama-3.3-70b-versatile   # optional, see note above
GEMINI_API_KEY=<your key>            # secondary/fallback model - chat/insights fail over to Groq if unset/failing
GEMINI_MODEL=gemini-2.0-flash        # optional, see note above
```

If BOTH keys are unset, chat/insights fail with a clear 503 (same fail-fast contract each client
already had individually).

## Port

8101 (see `moodmate-gateway/application.yml`'s `ai-chat-service` / `insights-service` routes).
