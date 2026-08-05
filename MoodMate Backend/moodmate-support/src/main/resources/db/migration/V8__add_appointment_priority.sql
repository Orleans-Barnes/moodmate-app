-- Premium gating breadth (Milestone item 7) - "priority counsellor booking" perk. Existing rows
-- backfill to false (not retroactively priority - only appointments booked from now on by a Pro
-- student get flagged, matching bookAppointment's "set once, at booking time" doc comment).

ALTER TABLE appointments ADD COLUMN priority BOOLEAN NOT NULL DEFAULT false;
