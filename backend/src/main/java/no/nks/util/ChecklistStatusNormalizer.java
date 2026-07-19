package no.nks.util;

/**
 * Mobile / inspection checklist status wire values.
 * Persisted values are OK / Dev / NA; Norwegian aliases map in.
 */
public final class ChecklistStatusNormalizer {

    private ChecklistStatusNormalizer() {}

    /**
     * Normalize incoming status aliases to persisted wire values.
     * Unknown / blank input is returned unchanged (including null).
     */
    public static String normalize(String status) {
        if ("IA".equals(status)) {
            return "NA";
        }
        if ("Avvik".equals(status)) {
            return "Dev";
        }
        return status;
    }

    public static boolean isPhotoEligible(String status) {
        return status != null && !status.isEmpty() && !"NA".equals(status);
    }

    public static boolean isDeviation(String status) {
        return "Dev".equals(status);
    }
}
