package com.moodmate.support;

import org.junit.jupiter.api.Test;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.PropertySource;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MigrationLayoutTest {

    @Test
    void supportMigrationsDoNotRedefineAlreadyAppliedVersion10() throws IOException {
        Path migrationDir = Path.of("src", "main", "resources", "db", "migration");

        List<String> migrationNames;
        try (var stream = Files.list(migrationDir)) {
            migrationNames = stream
                    .map(path -> path.getFileName().toString())
                    .toList();
        }

        assertFalse(migrationNames.stream().anyMatch(name -> name.startsWith("V10__")),
                "The shared support database already has a different V10 checksum applied; add new support schema changes as V12+.");
        assertTrue(migrationNames.contains("V12__fix_counsellor_status_constraint.sql"),
                "The counsellor status constraint fix must live in a new migration version.");
    }

    @Test
    void flywayIgnoresIntentionallyMissingSharedDatabaseMigration() throws IOException {
        StandardEnvironment environment = new StandardEnvironment();
        YamlPropertySourceLoader loader = new YamlPropertySourceLoader();
        List<PropertySource<?>> sources = loader.load("application", new ClassPathResource("application.yml"));
        sources.forEach(source -> environment.getPropertySources().addLast(source));

        assertEquals("*:missing", environment.getProperty("spring.flyway.ignore-migration-patterns[0]"),
                "Flyway must tolerate the intentionally missing shared-database V10.");
    }
}
