package com.moodmate.support.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Lob;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class EscalationCaseMappingTest {

    @Test
    void longTextFieldsMapToPostgresTextNotLargeObjectOid() throws NoSuchFieldException {
        assertTextColumn(EscalationCase.class.getDeclaredField("concern"));
        assertTextColumn(EscalationCase.class.getDeclaredField("feedback"));
    }

    private static void assertTextColumn(Field field) {
        assertNull(field.getAnnotation(Lob.class),
                field.getName() + " must not use @Lob because PostgreSQL validates String LOBs as oid.");
        assertEquals("TEXT", field.getAnnotation(Column.class).columnDefinition());
    }
}
