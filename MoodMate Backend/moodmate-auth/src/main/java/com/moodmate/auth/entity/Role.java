package com.moodmate.auth.entity;

// Phase 1G - added MENTOR alongside COUNSELLOR/ADMIN. Promoted the same way COUNSELLOR is - see
// InternalUserController.updateRole and moodmate-support's AuthServiceClient.promoteToMentor.
public enum Role { STUDENT, COUNSELLOR, MENTOR, ADMIN }
