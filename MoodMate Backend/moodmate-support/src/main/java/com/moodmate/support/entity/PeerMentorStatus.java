package com.moodmate.support.entity;

// Added for Fix #4 (Peer Mentor self-serve application flow) - mirrors CounsellorStatus exactly,
// minus SUSPENDED (an already-approved mentor is deactivated via the pre-existing `available`
// boolean instead, same as before this change - see SupportService.setPeerMentorActive). Existing
// seeded roster rows are backfilled to APPROVED by migration V6, since they pre-date this whole
// application/approval concept and were already live.
public enum PeerMentorStatus { PENDING, APPROVED, REJECTED }
