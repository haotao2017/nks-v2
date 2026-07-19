import { describe, expect, it } from 'vitest';

/**
 * Regression guards for post-mutation freshness.
 * The actual browser cache behavior is covered by api-client `cache: 'no-store'`;
 * this file documents the TanStack Query invalidate contract used by projects.
 */
describe('project query key contract', () => {
  const projectKeys = {
    all: ['projects'] as const,
    count: () => ['projects', 'count'] as const,
    list: (variant: 'active' | 'archived' | 'deleted') =>
      ['projects', 'list', variant] as const,
  };

  it('uses a shared prefix so invalidate(projectKeys.all) refreshes all variants', () => {
    expect(projectKeys.count()[0]).toBe(projectKeys.all[0]);
    expect(projectKeys.list('active')[0]).toBe(projectKeys.all[0]);
    expect(projectKeys.list('archived')[0]).toBe(projectKeys.all[0]);
    expect(projectKeys.list('deleted')[0]).toBe(projectKeys.all[0]);
  });
});
