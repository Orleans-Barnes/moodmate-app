package com.moodmate.journal.repository;

import com.moodmate.journal.entity.JournalEntry;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.TestPropertySource;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Feature 17 (Integration Testing) - Part "Database". Unlike every other test in this project
 * (mock() + new ServiceClass(mocks...), see e.g. JournalServiceTest), this one runs real SQL
 * against a real (embedded, in-memory) database - it's the one thing that class of test can never
 * catch: a typo'd JPQL property name, an @ElementCollection join that doesn't actually work, a
 * pagination/count-query mismatch, etc.
 *
 * Two properties are overridden from the real application.yml for this test slice:
 *  - spring.flyway.enabled=false: the real V1/V2 migrations are hand-written Postgres SQL (this
 *    service's schema is created via Flyway against real Postgres in every other environment) -
 *    they are not portable to H2 as-is, and rewriting them in a Postgres/H2-compatible dialect
 *    just for this test isn't worth the upkeep burden for one repository's tests.
 *  - spring.jpa.hibernate.ddl-auto=create-drop: with Flyway disabled, Hibernate generates the
 *    schema directly from the @Entity mappings instead - JournalEntry has no Postgres-only column
 *    types (columnDefinition="TEXT" and the @ElementCollection tags side-table are both portable),
 *    so this reproduces the real schema's shape closely enough for these tests to be meaningful.
 *  - spring.jpa.properties.hibernate.default_schema= (blanked): the real value ("journal") only
 *    exists in Postgres, not in the embedded H2 database - see the property's own comment below.
 *
 * @DataJpaTest already replaces the configured datasource with an embedded one by default
 * (@AutoConfigureTestDatabase's default Replace.ANY) - the explicit annotation below just makes
 * that choice visible rather than implicit.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@TestPropertySource(properties = {
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        // application.yml sets this to "journal" for real Postgres (currentSchema=journal in the
        // datasource URL). The embedded H2 instance @DataJpaTest swaps in has no such schema and
        // won't auto-create one, so without this override every insert failed with
        // "Schema JOURNAL not found" - blanking it here lets Hibernate create tables in H2's
        // default (unschema'd/PUBLIC) namespace instead, which is all this test needs.
        "spring.jpa.properties.hibernate.default_schema="
})
class JournalEntryRepositoryTest {

    @Autowired
    private JournalEntryRepository repository;

    @Test
    void findByUserIdOrderByCreatedAtDescReturnsOnlyThatUsersEntriesNewestFirst() {
        save(1L, "First", "oldest", null, false, Set.of(), Instant.now().minus(2, ChronoUnit.DAYS));
        save(1L, "Second", "middle", null, false, Set.of(), Instant.now().minus(1, ChronoUnit.DAYS));
        save(2L, "Someone else's", "should not appear", null, false, Set.of(), Instant.now());

        Page<JournalEntry> page = repository.findByUserIdOrderByCreatedAtDesc(1L, PageRequest.of(0, 20));

        assertEquals(2, page.getTotalElements());
        assertEquals("Second", page.getContent().get(0).getTitle(), "newest entry must come first");
        assertEquals("First", page.getContent().get(1).getTitle());
    }

    @Test
    void findByIdAndUserIdDoesNotReturnAnotherUsersEntry() {
        JournalEntry entry = save(1L, "Mine", "body", null, false, Set.of(), Instant.now());

        Optional<JournalEntry> asOwner = repository.findByIdAndUserId(entry.getId(), 1L);
        Optional<JournalEntry> asStranger = repository.findByIdAndUserId(entry.getId(), 2L);

        assertTrue(asOwner.isPresent());
        assertFalse(asStranger.isPresent(), "a different user's id must not be able to load someone else's entry");
    }

    @Test
    void countByUserIdCountsOnlyThatUsersEntries() {
        save(1L, "A", "a", null, false, Set.of(), Instant.now());
        save(1L, "B", "b", null, false, Set.of(), Instant.now());
        save(2L, "C", "c", null, false, Set.of(), Instant.now());

        assertEquals(2, repository.countByUserId(1L));
        assertEquals(1, repository.countByUserId(2L));
    }

    @Test
    void searchFiltersByTextEmotionFavoriteAndTagTogether() {
        save(1L, "Gratitude walk", "felt calm today", "😊", true, Set.of("gratitude", "outdoors"), Instant.now());
        save(1L, "Rough day", "felt calm about nothing", "😢", false, Set.of("vent"), Instant.now());
        save(1L, "Unrelated", "totally different content", "😊", true, Set.of("gratitude"), Instant.now());

        Page<JournalEntry> byText = repository.search(1L, "calm", null, null, null, null, null, PageRequest.of(0, 20));
        assertEquals(2, byText.getTotalElements(), "text search should match both entries containing 'calm'");

        Page<JournalEntry> byEmotionAndFavorite = repository.search(1L, null, null, null, "😊", true, null, PageRequest.of(0, 20));
        assertEquals(2, byEmotionAndFavorite.getTotalElements());

        Page<JournalEntry> byTag = repository.search(1L, null, null, null, null, null, "outdoors", PageRequest.of(0, 20));
        assertEquals(1, byTag.getTotalElements());
        assertEquals("Gratitude walk", byTag.getContent().get(0).getTitle());

        Page<JournalEntry> byTextAndTag = repository.search(1L, "calm", null, null, null, null, "gratitude", PageRequest.of(0, 20));
        assertEquals(1, byTextAndTag.getTotalElements(), "combining filters must AND them together, not OR");
    }

    @Test
    void searchDoesNotDuplicateRowsForEntriesWithMultipleTags() {
        // Regression check for the DISTINCT documented on JournalEntryRepository.search() - a
        // LEFT JOIN against a multi-valued tags collection can fan out into duplicate rows per
        // entry without it.
        save(1L, "Multi-tag entry", "body", null, false, Set.of("a", "b", "c"), Instant.now());

        Page<JournalEntry> result = repository.search(1L, null, null, null, null, null, null, PageRequest.of(0, 20));

        assertEquals(1, result.getTotalElements(), "an entry with 3 tags must still count once, not 3 times");
    }

    @Test
    void findDistinctTagsByUserIdReturnsSortedUniqueTagsForThatUserOnly() {
        save(1L, "A", "a", null, false, Set.of("zebra", "apple"), Instant.now());
        save(1L, "B", "b", null, false, Set.of("apple", "mango"), Instant.now());
        save(2L, "C", "c", null, false, Set.of("other-user-tag"), Instant.now());

        List<String> tags = repository.findDistinctTagsByUserId(1L);

        assertEquals(List.of("apple", "mango", "zebra"), tags);
    }

    private JournalEntry save(Long userId, String title, String body, String moodEmoji, boolean favorite,
                               Set<String> tags, Instant createdAt) {
        JournalEntry entry = JournalEntry.builder()
                .userId(userId)
                .title(title)
                .body(body)
                .moodEmoji(moodEmoji)
                .favorite(favorite)
                .tags(new java.util.HashSet<>(tags))
                .createdAt(createdAt)
                .updatedAt(createdAt)
                .build();
        return repository.saveAndFlush(entry);
    }
}
