package com.moodmate.backend.community;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.List;

/**
 * Produces a fresh "Anonymous &lt;Animal&gt;" handle for each new post - deliberately NOT a
 * stable per-user pseudonym, so a person's posts can't be linked to each other by handle alone.
 * The frontend's mock data used literal strings like "Anonymous Owl" / "Anonymous Fox" with no
 * generator behind them (confirmed - no such logic exists in the frontend repo); this is a
 * clean-room server-side implementation of that pattern.
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
