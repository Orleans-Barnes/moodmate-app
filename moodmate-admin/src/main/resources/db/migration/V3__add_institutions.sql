-- Institution Management (Milestone). Replaces the frontend's hardcoded ghana.ts catalogue as the
-- backend source of truth. Backfilled 1:1 from src/data/institutions/ghana.ts so signup behavior
-- doesn't change the moment the frontend switches over to GET /api/public/institutions - same
-- names/shortNames/cities/types, in the same order. license_type/license_expiry/student_limit are
-- left NULL for every row (see Institution.java's doc comment - future milestone, not built yet).

CREATE TABLE institutions (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    short_name      VARCHAR(50) NOT NULL,
    city            VARCHAR(100),
    country         VARCHAR(100) NOT NULL,
    type            VARCHAR(30) NOT NULL,
    active          BOOLEAN NOT NULL DEFAULT true,
    website         VARCHAR(255),
    logo_url        VARCHAR(500),
    license_type    VARCHAR(50),
    license_expiry  DATE,
    student_limit   INTEGER,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_institutions_active ON institutions (active);
CREATE UNIQUE INDEX idx_institutions_short_name ON institutions (LOWER(short_name));

INSERT INTO institutions (name, short_name, city, country, type, active) VALUES
('Kwame Nkrumah University of Science and Technology', 'KNUST', 'Kumasi', 'Ghana', 'UNIVERSITY', true),
('University of Ghana', 'UG', 'Legon, Accra', 'Ghana', 'UNIVERSITY', true),
('University of Cape Coast', 'UCC', 'Cape Coast', 'Ghana', 'UNIVERSITY', true),
('University for Development Studies', 'UDS', 'Tamale', 'Ghana', 'UNIVERSITY', true),
('Ashesi University', 'Ashesi', 'Berekuso', 'Ghana', 'UNIVERSITY', true),
('University of Energy and Natural Resources', 'UENR', 'Sunyani', 'Ghana', 'UNIVERSITY', true),
('University of Health and Allied Sciences', 'UHAS', 'Ho', 'Ghana', 'UNIVERSITY', true),
('Ghana Communication Technology University', 'GCTU', 'Accra', 'Ghana', 'UNIVERSITY', true),
('Academic City University', 'ACU', 'Accra', 'Ghana', 'UNIVERSITY', true),
('Central University', 'Central', 'Miotso', 'Ghana', 'UNIVERSITY', true),
('Wisconsin International University College', 'WIUC', 'Accra', 'Ghana', 'UNIVERSITY_COLLEGE', true),
('Methodist University Ghana', 'MUG', 'Accra', 'Ghana', 'UNIVERSITY', true),
('Regent University College of Science and Technology', 'Regent', 'Accra', 'Ghana', 'UNIVERSITY_COLLEGE', true),
('Valley View University', 'VVU', 'Oyibi, Accra', 'Ghana', 'UNIVERSITY', true),
('Catholic University College of Ghana', 'CUCG', 'Fiapre, Sunyani', 'Ghana', 'UNIVERSITY_COLLEGE', true),
('University of Education, Winneba', 'UEW', 'Winneba', 'Ghana', 'UNIVERSITY', true),
('Ghana Institute of Management and Public Administration', 'GIMPA', 'Accra', 'Ghana', 'INSTITUTE', true),
('My institution isn''t listed', 'Other', NULL, 'Ghana', 'INSTITUTE', true);
