-- Phase 1E, Step 2: the notifications/inbox table. Every other service (support, mood, journal,
-- wellness, gamification, admin, ai) becomes a producer that POSTs to this service's
-- /internal/notifications endpoint rather than writing into this schema directly - see
-- InternalNotificationController's doc comment for why this endpoint is deliberately not routed
-- through the gateway.
CREATE TABLE notifications (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL,
    type                VARCHAR(40) NOT NULL,
    title               VARCHAR(200) NOT NULL,
    body                VARCHAR(1000) NOT NULL,
    destination_screen  VARCHAR(100),
    destination_params  TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    scheduled_at        TIMESTAMP,
    delivered_at        TIMESTAMP,
    read_at             TIMESTAMP,
    metadata            TEXT,
    created_at          TIMESTAMP NOT NULL DEFAULT now()
);

-- "my notifications, newest first" (GET /api/notifications) and "my unread count" (GET
-- /api/notifications/unread-count) are the two hot-path queries - both filter on user_id, the
-- unread-count one additionally on read_at IS NULL, and the list one orders by created_at DESC.
CREATE INDEX idx_notifications_user_created ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications (user_id) WHERE read_at IS NULL;
