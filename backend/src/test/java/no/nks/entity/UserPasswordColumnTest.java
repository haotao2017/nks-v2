package no.nks.entity;

import org.junit.jupiter.api.Test;

import jakarta.persistence.Column;
import java.lang.reflect.Field;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class UserPasswordColumnTest {

    @Test
    void passwordColumnIsWideEnoughForBcrypt() throws Exception {
        Field field = User.class.getDeclaredField("password");
        Column column = field.getAnnotation(Column.class);
        assertNotNull(column);
        assertEquals(255, column.length());
    }
}
