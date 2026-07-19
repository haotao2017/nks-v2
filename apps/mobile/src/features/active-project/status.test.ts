import { describe, expect, it } from 'vitest';

import {
  normalizeChecklistStatus,
  shouldClearStatusAfterAllImagesRemoved,
  shouldDeferStatusForPhoto,
  statusRequiresPhoto,
} from './status';

describe('normalizeChecklistStatus', () => {
  it('keeps wire values', () => {
    expect(normalizeChecklistStatus('OK')).toBe('OK');
    expect(normalizeChecklistStatus('Dev')).toBe('Dev');
    expect(normalizeChecklistStatus('NA')).toBe('NA');
  });

  it('maps Norwegian aliases', () => {
    expect(normalizeChecklistStatus('Avvik')).toBe('Dev');
    expect(normalizeChecklistStatus('IA')).toBe('NA');
  });

  it('returns null for blank/unknown', () => {
    expect(normalizeChecklistStatus(null)).toBeNull();
    expect(normalizeChecklistStatus(undefined)).toBeNull();
    expect(normalizeChecklistStatus('')).toBeNull();
    expect(normalizeChecklistStatus('Pending')).toBeNull();
  });
});

describe('photo gate helpers', () => {
  it('requires photo for OK and Dev only', () => {
    expect(statusRequiresPhoto('OK')).toBe(true);
    expect(statusRequiresPhoto('Dev')).toBe(true);
    expect(statusRequiresPhoto('NA')).toBe(false);
  });

  it('defers OK/Dev when no images', () => {
    expect(shouldDeferStatusForPhoto('OK', 0)).toBe(true);
    expect(shouldDeferStatusForPhoto('Dev', 0)).toBe(true);
    expect(shouldDeferStatusForPhoto('OK', 1)).toBe(false);
    expect(shouldDeferStatusForPhoto('NA', 0)).toBe(false);
  });

  it('clears status when last OK/Dev photo is removed', () => {
    expect(shouldClearStatusAfterAllImagesRemoved('OK', 0)).toBe(true);
    expect(shouldClearStatusAfterAllImagesRemoved('Dev', 0)).toBe(true);
    expect(shouldClearStatusAfterAllImagesRemoved('NA', 0)).toBe(false);
    expect(shouldClearStatusAfterAllImagesRemoved('OK', 1)).toBe(false);
    expect(shouldClearStatusAfterAllImagesRemoved(null, 0)).toBe(false);
  });
});
