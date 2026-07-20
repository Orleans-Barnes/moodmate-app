package com.moodmate.support.client;

/** Local copy of auth-service's role-promotion request body. role is sent as a plain string
 * ("COUNSELLOR") rather than depending on auth-service's Role enum type - Jackson deserializes a
 * matching string into auth's own Role enum on the receiving end just fine, and this keeps the
 * two services decoupled at compile time. */
public record RoleUpdateRequest(String role) {
}
