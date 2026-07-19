package no.nks.util;

/**
 * Soft-delete / archive flags for Project.
 * Active list queries treat only NULL as "not deleted/archived"; false would hide restore.
 */
public final class SoftDeleteFlags {

    private SoftDeleteFlags() {}

    /** true → Boolean.TRUE; false (restore/unarchive) → null for JPQL IS NULL matches. */
    public static Boolean toFlag(boolean enabled) {
        return enabled ? Boolean.TRUE : null;
    }
}
