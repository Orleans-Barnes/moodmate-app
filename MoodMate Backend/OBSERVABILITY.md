# MoodMate Observability (Feature 16)

Covers correlation IDs, structured logging, Actuator, Micrometer, Prometheus, Grafana, and the
Docker monitoring stack, across all 12 services (gateway + 11 servlet-based services).

## 1. Correlation IDs

Every request gets an `X-Correlation-Id`:

- **Gateway** (`CorrelationIdGlobalFilter`, `moodmate-gateway/.../filter/`): a reactive
  `GlobalFilter` (runs on every route automatically, no per-route wiring). Preserves a
  client-supplied `X-Correlation-Id` unchanged; generates a UUID if absent. Forwards it downstream
  and echoes it back on the response.
- **Every other service** (`CorrelationIdFilter`, one copy per service in
  `moodmate-<name>/.../filter/`, same pattern this project already uses for cross-service enums
  like `LeafTransactionReason`): a servlet `OncePerRequestFilter` at `Ordered.HIGHEST_PRECEDENCE`.
  Reads the header into SLF4J MDC (`correlationId`), regenerates one if missing (covers direct
  calls that bypass the gateway, and today's internal `*ServiceClient` service-to-service calls,
  which don't yet forward the header - see "Known follow-ups" below). Always clears MDC in a
  `finally` block.

## 2. Structured logging

Every log line now looks like:

```
2026-07-16 15:24:10 INFO  [journal-service] [http-nio-8097-exec-3] [correlationId=ab12cd34-...] c.m.j.filter.CorrelationIdFilter - GET /api/journal/search completed 200 in 47 ms
```

Timestamp, level, service name, thread, correlation ID, logger class, message - configured via
`logging.pattern.console` in each `application.yml` (Spring Boot's built-in pattern layout + MDC,
not a JSON logging library - see the scope note below). `CorrelationIdFilter`/
`CorrelationIdGlobalFilter` themselves log the method, URI, status, and duration for every request,
so request logging didn't need a second filter class.

**Scope decision:** this is text logging with structure (consistent fields, always present, easy
to `grep`/`awk`), not JSON logging. Full JSON logs would need `logstash-logback-encoder` plus a
`logback-spring.xml` in all 12 modules - a meaningfully bigger footprint, and this project has no
log aggregator (ELK/Loki/etc.) that would actually consume JSON logs today. If one gets added
later, this is the natural next step.

## 3. Spring Boot Actuator

Every service now exposes:

- `/actuator/health`, `/actuator/health/liveness`, `/actuator/health/readiness`
- `/actuator/info`
- `/actuator/metrics`
- `/actuator/prometheus`

`management.endpoint.health.probes.enabled: true` plus `livenessstate`/`readinessstate` turns on
the liveness/readiness groups explicitly (they otherwise only auto-activate under a detected
Kubernetes environment). Liveness reports whether the JVM itself is broken; readiness additionally
folds in the DB health indicator (auto-registered by `spring-boot-starter-data-jpa` +
`DataSourceHealthIndicator`) and disk space (auto-registered `DiskSpaceHealthIndicator`) - so
"readiness" already covers "database availability" and "disk space" from Part 8 with no extra
code, both are Spring Boot Actuator defaults once actuator is on the classpath.

**Security note (read this before a real production deploy):** none of these 12 services has
Spring Security on its own classpath - JWT is validated only at the gateway, by design (see this
project's CLAUDE.md). That means `/actuator/prometheus` and `/actuator/metrics` are reachable
unauthenticated on each service's own port, same as `/actuator/health`/`/info` already were before
this feature. This is an acceptable trade for a hackathon/dev topology where these ports aren't
publicly exposed anyway. Before a real production deployment: put these services behind a network
boundary that only Prometheus can reach (e.g. a separate `management.server.port` firewalled from
the internet, or a reverse proxy rule restricting `/actuator/**` to the monitoring subnet) - don't
rely on "nobody will guess the URL."

## 4. Micrometer metrics

No custom metric code was added for infrastructure metrics - Spring Boot + Micrometer already
auto-record all of these once actuator + `micrometer-registry-prometheus` are present:

- `http_server_requests_seconds_count` / `_sum` - HTTP request count + latency, tagged by
  `service`, `uri`, `method`, `status`
- `http_server_requests_seconds{quantile="0.95"|"0.99"}` - P95/P99 latency (enabled via
  `management.metrics.distribution.percentiles.http.server.requests` in each `application.yml`)
- `jvm_memory_used_bytes`, `jvm_threads_live_threads`, `jvm_gc_pause_seconds_*` - JVM memory/
  threads/GC
- `process_cpu_usage`, `process_uptime_seconds` - CPU + uptime
- `hikaricp_connections_active/idle/pending/max` - DB connection pool (auto-bound because Hikari +
  Micrometer are both already on the classpath)
- Gateway: `spring_cloud_gateway_requests_seconds_*` - per-route gateway traffic/latency (Spring
  Cloud Gateway's own metric, not `http.server.requests` - the gateway is reactive with no
  `@RestController` endpoints of its own)

"Active sessions" from the feature spec doesn't apply here - auth is stateless JWT, there's no
server-side session store to measure.

## 5. Prometheus

`micrometer-registry-prometheus` was added to all 12 `pom.xml`s (version managed by the
`spring-boot-dependencies` BOM already imported via `moodmate-parent`, same as every other
unversioned dependency in this project). Each service exposes `/actuator/prometheus` once that
dependency is present and the endpoint is in `management.endpoints.web.exposure.include`.

`monitoring/prometheus/prometheus.yml` is the centralized scrape config - one `job_name` per
service, 15s scrape interval, targeting `host.docker.internal:<port>` (the services run directly
on the host via `start-all.bat`, not in Docker - see that file's own comments; `prometheus.yml`
explains the `host.docker.internal` choice and how to change it if services get containerized
later).

Job-name mapping note: the feature spec names some services ("User Service", "Counsellor Service",
"Notification Service", "Payment/Billing Service") that don't exist as separate deployables in
this codebase - those responsibilities live inside `moodmate-auth` (users, push notifications),
`moodmate-support` (counsellor bookings), and `moodmate-wallet` (payments/billing). The scrape
config uses this project's actual module names rather than inventing services that don't exist.

## 6. Grafana

Five dashboards, auto-provisioned (`monitoring/grafana/provisioning/`, no manual import needed):

- **API Monitoring** - requests/sec, avg response time, P95/P99 latency, 5xx error rate, slowest
  endpoints (all per-service)
- **JVM** - heap/non-heap usage, GC pause time, thread count, CPU, uptime
- **Database** - HikariCP active/idle/pending connections, connection acquire time, connection
  usage time (a proxy for query latency - Micrometer doesn't get per-query timing from JPA/Hibernate
  without additional instrumentation this pass didn't add)
- **Gateway** - request throughput per route, response status code breakdown, P95/P99 gateway
  latency, upstream 5xx failures, 429 (rate-limited) rejections
- **Business Metrics** - see below; these panels reference metric names that don't exist yet and
  will show "No data" until instrumented

## Business metrics - extension points, not wired in this pass

The feature spec's Business dashboard (active users, mood check-ins, journal entries, counsellor
bookings, subscriptions, payment volume/revenue, gamification usage, DAU/MAU) needs *custom*
counters/gauges - Spring Boot doesn't auto-generate these the way it does JVM/HTTP metrics.
Wiring them in means adding a `MeterRegistry` dependency and a `.increment()`/gauge call inside 5
different already-shipped, already-working service classes (`MoodService`, `JournalService`,
`SupportService`, `PaymentsService`, `GamificationService`) across 5 separate microservices.

**Deliberately not done in this pass** - it would meaningfully widen this already-large feature's
blast radius across core business logic in five unrelated services, for panels that are otherwise
complete and ready to receive data the moment those counters exist. The Business dashboard's
panels are pre-built against the exact metric names below - add the instrumentation and the
dashboard "just works," no Grafana changes needed:

| Metric name | Type | Where to add it |
|---|---|---|
| `moodmate_mood_checkins_total` | Counter | `MoodService`, after a check-in is saved |
| `moodmate_journal_entries_total` | Counter | `JournalService`, after an entry is created |
| `moodmate_support_bookings_total` | Counter | `SupportService`, after a booking is confirmed |
| `moodmate_wallet_active_subscriptions` | Gauge | `PaymentsService`, backed by a live COUNT query |
| `moodmate_wallet_payment_volume_total` | Counter | `PaymentsService`, after a payment succeeds |
| `moodmate_gamification_actions_total` | Counter | `GamificationService`, after XP/goal actions |
| `moodmate_auth_daily_active_users` / `_monthly_active_users` | Gauge | `moodmate-auth`, backed by a scheduled query over recent login/activity timestamps |

Example of what adding one looks like (not applied in this pass):
```java
private final MeterRegistry meterRegistry; // add to the @RequiredArgsConstructor field list

// after a successful save:
meterRegistry.counter("moodmate.mood.checkins").increment();
```
Say the word and this can be wired into all five services as a fast follow.

## 7. Docker monitoring stack

`docker-compose.monitoring.yml` at the repo root runs **only** Prometheus + Grafana - it does not
containerize the 12 MoodMate services themselves (they still run via `start-all.bat`, unchanged).
It can be started independently, in any order relative to the services:

```bash
docker compose -f docker-compose.monitoring.yml up -d
```

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (login `admin` / `admin`, Grafana will force a password change on
  first login)

Grafana's dashboards and Prometheus's scraped data persist across restarts via named Docker
volumes (`grafana-data`, `prometheus-data`) - `docker compose down` keeps them, `docker compose
down -v` wipes them.

```bash
docker compose -f docker-compose.monitoring.yml down       # stop, keep data
docker compose -f docker-compose.monitoring.yml down -v    # stop, wipe data
```

## 8. Health monitoring

Covered under Part 3 above - `/actuator/health/liveness` and `/actuator/health/readiness` per
service. The gateway does **not** aggregate downstream health checks in this pass (Spring Cloud
Gateway doesn't include an actuator health-aggregation module by default, and building a custom
one - polling all 11 services' `/actuator/health` and rolling the result into the gateway's own
health endpoint - is a genuinely separate, non-trivial addition). For now, monitor each service's
health independently (Prometheus's own "Targets" page at http://localhost:9090/targets already
shows per-service up/down at a glance, which covers most of what a gateway-level aggregate would
give you). Flagging this as a known gap rather than silently skipping it.

## 9. Performance monitoring

Average response time, P95/P99 latency, throughput, error percentage, and request duration
distribution are all queryable in Prometheus/Grafana today via the metrics listed in Part 4 - no
custom code, per the feature spec's own instruction to lean on Micrometer/Prometheus rather than
building bespoke performance-tracking logic.

## 10. Testing

- `CorrelationIdGlobalFilterTest` (`moodmate-gateway`) - covers the gateway's reactive filter:
  generates an ID when missing, preserves a client-supplied one, never short-circuits the request.
- `CorrelationIdFilterTest` (`moodmate-wellness`) - representative test for the identical filter
  class duplicated across all 11 servlet-based services: generates/preserves the ID, sets the
  response header, and - the one most worth testing explicitly - clears MDC both on the normal
  path and when the downstream chain throws.

Per this feature's own instruction ("use representative tests for shared patterns instead of
duplicating nearly identical tests across every service"), the other 10 services' `CorrelationIdFilter`
copies are not independently re-tested - they're the same class, and the copy-per-service pattern
already exists elsewhere in this project (e.g. `LeafTransactionReason`) without per-copy tests.

Actuator health/metrics/prometheus endpoint availability wasn't covered with a dedicated
`@SpringBootTest`/`MockMvc` test in this pass - these are Spring Boot's own auto-configured
endpoints (not new code this project wrote), so the highest-value verification is actually running
each service and hitting the URLs directly, which is called out as a verification step below.

## Known follow-ups (not done in this pass)

1. **Service-to-service correlation ID propagation.** The `*ServiceClient` classes (e.g.
   `WalletServiceClient`, `PaymentsServiceClient`) don't yet forward `X-Correlation-Id` on their
   outbound calls - each receiving service's `CorrelationIdFilter` generates its own ID in that
   case, so a single user-facing request that fans out to 2-3 services currently gets 2-3
   *different* correlation IDs instead of one shared one across that whole call chain. Fixing this
   means reading `MDC.get("correlationId")` in each client and setting it as a request header on
   the outbound `RestClient` call - a small, mechanical change, but it touches the same client
   classes Feature 15 (Production Hardening) already modified, so it's being called out rather
   than bundled in here.
2. **Business metrics** - see the table above.
3. **Gateway-level health aggregation** - see Part 8.
4. **Actuator endpoint security** - see the Part 3 security note.
