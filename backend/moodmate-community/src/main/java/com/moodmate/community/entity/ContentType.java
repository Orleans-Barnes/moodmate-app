package com.moodmate.community.entity;

/** New for Feature 7 (Community Moderation) - distinguishes what a ContentReport points at, since
 * content_id alone is ambiguous (a post and a comment can share the same numeric id). */
public enum ContentType {
    POST, COMMENT
}
