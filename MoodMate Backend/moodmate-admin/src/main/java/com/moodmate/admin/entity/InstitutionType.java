package com.moodmate.admin.entity;

/** Mirrors the frontend's InstitutionType union (src/data/institutions/types.ts) - kept in sync by
 * hand since the frontend still ships its own bundled fallback catalogue (see Institution's doc
 * comment on why that fallback exists). */
public enum InstitutionType {
    UNIVERSITY,
    UNIVERSITY_COLLEGE,
    INSTITUTE
}
