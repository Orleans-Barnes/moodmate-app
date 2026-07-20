package com.moodmate.community;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.List;

/**
 * Produces a fresh "Anonymous &lt;Animal&gt;" handle for each new post - deliberately NOT a
 * stable per-user pseudonym, so a person's posts can't be linked to each other by handle alone.
 * Ported verbatim from the monolith - the pre-existing stub used a different, non-monolith word
 * list ("Calm Owl", "Brave Sparrow", ...) picked with a plain (non-secure) Random; this restores
 * the monolith's actual product content and SecureRandom choice.
 */
@Component
public class AnonymousHandleGenerator {

    private static final List<String> ANIMALS = List.of(
            "Owl", "Fox", "Otter", "Sparrow", "Hedgehog", "Falcon", "Panda", "Dolphin",
            "Koala", "Heron", "Lynx", "Badger", "Swan", "Gazelle", "Robin", "Wren"
    );

    private final SecureRandom random = new SecureRandom();

    public String generate() {
        return "Anonymous " + ANIMALS.get(random.nextInt(ANIMALS.size()));
    }
}
