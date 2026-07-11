package com.moodmate.backend.crisis;

/** Lifecycle state of a crisis alert. */
public enum CrisisStatus {
    OPEN,          // Not yet seen by any counsellor
    ACKNOWLEDGED,  // A counsellor has seen it and is following up
    RESOLVED       // Counsellor has closed it with a resolution note
}
