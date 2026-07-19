package no.nks.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SoftDeleteFlagsTest {

    @Test
    void enabledStoresTrue() {
        assertEquals(Boolean.TRUE, SoftDeleteFlags.toFlag(true));
        assertTrue(SoftDeleteFlags.toFlag(true));
    }

    @Test
    void restoreClearsToNull() {
        assertNull(SoftDeleteFlags.toFlag(false));
    }
}
