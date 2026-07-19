package no.nks.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ChecklistStatusNormalizerTest {

    @Test
    void mapsNorwegianAliases() {
        assertEquals("NA", ChecklistStatusNormalizer.normalize("IA"));
        assertEquals("Dev", ChecklistStatusNormalizer.normalize("Avvik"));
    }

    @Test
    void keepsWireValues() {
        assertEquals("OK", ChecklistStatusNormalizer.normalize("OK"));
        assertEquals("Dev", ChecklistStatusNormalizer.normalize("Dev"));
        assertEquals("NA", ChecklistStatusNormalizer.normalize("NA"));
    }

    @Test
    void leavesBlankAndUnknownUnchanged() {
        assertNull(ChecklistStatusNormalizer.normalize(null));
        assertEquals("", ChecklistStatusNormalizer.normalize(""));
        assertEquals("Pending", ChecklistStatusNormalizer.normalize("Pending"));
    }

    @Test
    void photoEligibility() {
        assertTrue(ChecklistStatusNormalizer.isPhotoEligible("OK"));
        assertTrue(ChecklistStatusNormalizer.isPhotoEligible("Dev"));
        assertFalse(ChecklistStatusNormalizer.isPhotoEligible("NA"));
        assertFalse(ChecklistStatusNormalizer.isPhotoEligible(null));
        assertFalse(ChecklistStatusNormalizer.isPhotoEligible(""));
    }

    @Test
    void deviationFlag() {
        assertTrue(ChecklistStatusNormalizer.isDeviation("Dev"));
        assertFalse(ChecklistStatusNormalizer.isDeviation("OK"));
        assertFalse(ChecklistStatusNormalizer.isDeviation("NA"));
    }
}
