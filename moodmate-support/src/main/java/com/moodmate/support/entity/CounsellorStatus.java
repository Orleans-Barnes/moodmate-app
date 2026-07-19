package com.moodmate.support.entity;
// SUSPENDED added Phase 1H (Admin Portal - Counsellor Management) - an admin-reversible state for
// an already-APPROVED counsellor, distinct from REJECTED (which only ever applies to a PENDING
// request and is not reversible). listCounsellors() already filters on status == APPROVED, so a
// SUSPENDED counsellor simply stops appearing in the public roster with no other query changes.
public enum CounsellorStatus { PENDING, APPROVED, REJECTED, SUSPENDED }
