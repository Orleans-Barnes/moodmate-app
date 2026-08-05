-- Fix #5 (rating/review system) - one rating per COMPLETED appointment, submitted by the student
-- who booked it. See CounsellorRating's doc comment for why this is scoped to counsellors only.
CREATE TABLE counsellor_ratings (
    id               BIGSERIAL PRIMARY KEY,
    appointment_id   BIGINT NOT NULL UNIQUE REFERENCES appointments(id),
    counsellor_id    BIGINT NOT NULL,
    student_user_id  BIGINT NOT NULL,
    stars            INT NOT NULL,
    comment          TEXT,
    created_at       TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT chk_counsellor_ratings_stars CHECK (stars BETWEEN 1 AND 5)
);

CREATE INDEX idx_counsellor_ratings_counsellor ON counsellor_ratings (counsellor_id);
