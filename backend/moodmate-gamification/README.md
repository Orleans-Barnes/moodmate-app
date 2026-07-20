# MoodMate — Gamification Service

Achievements and missions on top of MoodMate's core wellness features. No monolith counterpart -
this is new functionality, separated into its own microservice from the start rather than added
to an existing one, since it's fully self-contained (owns its own `achievements`, `missions`,
`user_achievements`, and `user_mission_progress` tables and never needs to read another service's
data).

## Endpoints (`/api/gamification`, port 8098)

| Method | Path                     | Description                                    |
|--------|--------------------------|-------------------------------------------------|
| GET    | `/achievements`          | List all defined achievements.                  |
| GET    | `/achievements/mine`     | List the calling user's unlocked achievements.  |
| POST   | `/achievements/unlock`   | Unlock an achievement for the calling user.     |
| GET    | `/missions`              | List currently active (non-expired) missions.  |
| GET    | `/missions/progress`     | List the calling user's mission progress.      |
| POST   | `/missions/progress`     | Increment the calling user's progress on a mission. |

All endpoints trust the `X-User-Id` header the gateway sets from the verified JWT - same pattern
as every other service in this system (see `moodmate-gateway`'s `JwtAuthFilter`).

## Data ownership

Same "shared Postgres instance, one schema per service" model as the rest of the system - this
service owns the `gamification` schema outright (see `src/main/resources/db/migration`). `user_id`
columns reference auth-service's `users` table by value, not a foreign key, since that table now
lives in a different service/schema.
