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

Backed by Groq's OpenAI-compatible chat completions API. Model is `GROQ_MODEL` (default
`llama-3.3-70b-versatile`) - Groq's model lineup changes over time; if requests start failing,
check https://console.groq.com/docs/models and override the env var rather than hardcoding a new
default.

Every user message (not the AI's replies) is scanned by `CrisisKeywordDetector` - a plain
substring/keyword heuristic, **not** a clinical tool - before being sent to Groq. A match files an
alert with moodmate-crisis (`POST /internal/crisis/alerts`, source `AI_CHAT`) for a counsellor to
review; a failure to file that alert is logged but never blocks the chat reply itself from
reaching the student.

## Insights (`/api/insights`)

`wellnessScore` (0-100) and `sentimentScore` (-100 to 100) are computed deterministically from
mood-service's last 30 days of check-ins (stress/energy/emotion) - no LLM involved, so they're
fast and reproducible. Only `narrativeSummary` is Groq-generated; if Groq is unavailable, it falls
back to a templated sentence built from the same stats instead of failing the whole request.

Reads mood-service's new `GET /internal/mood/{userId}/trend` (added alongside this service) -
deliberately does NOT read journal-service, to avoid this service needing broad access into
private journal entries just to compute a score.

## Required environment variables

```
GROQ_API_KEY=<your key>       # required - chat/insights fail with a clear 503 if unset
GROQ_MODEL=llama-3.3-70b-versatile   # optional, see note above
```

## Port

8101 (see `moodmate-gateway/application.yml`'s `ai-chat-service` / `insights-service` routes).
