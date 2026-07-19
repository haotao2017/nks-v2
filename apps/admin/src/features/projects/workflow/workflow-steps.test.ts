import { describe, expect, it } from 'vitest';

import {
  filterStepsByService,
  getStepBySeq,
  SERVICE_INNHENTING,
  SERVICE_KONTROLL,
  WORKFLOW_STEPS,
} from './workflow-steps';

describe('WORKFLOW_STEPS registry', () => {
  it('exposes 15 UI steps (no independent send-rapport)', () => {
    expect(WORKFLOW_STEPS).toHaveLength(15);
    expect(WORKFLOW_STEPS.map((s) => s.key)).not.toContain('send-rapport');
    expect(WORKFLOW_STEPS.map((s) => s.seq)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    ]);
  });

  it('marks gjennomgå as inspect-report with approve', () => {
    const step = getStepBySeq(11);
    expect(step?.key).toBe('gjennomgaa-rapport');
    expect(step?.type).toBe('inspect-report');
    expect(step?.approve).toBe(true);
    expect(step?.workflowStepId).toBe(11);
  });

  it('requires project leader on påminnelse and kommende kontroll', () => {
    const reminder = WORKFLOW_STEPS.find((s) => s.key === 'send-paaminnelse');
    const upcoming = WORKFLOW_STEPS.find(
      (s) => s.key === 'epost-kommende-kontroll',
    );
    expect(reminder?.projectLeader).toBe(true);
    expect(reminder?.dateField).toBe(true);
    expect(upcoming?.projectLeader).toBe(true);
    expect(upcoming?.projectLeaderCc).toBe(true);
  });

  it('maps invoice / pdf backend step ids', () => {
    expect(getStepBySeq(12)?.workflowStepId).toBe(15);
    expect(getStepBySeq(13)?.workflowStepId).toBe(13);
    expect(getStepBySeq(14)?.workflowStepId).toBe(14);
    expect(getStepBySeq(15)?.workflowStepId).toBe(18);
  });
});

describe('filterStepsByService', () => {
  it('filters Kontroll subset by step key', () => {
    const keys = filterStepsByService(WORKFLOW_STEPS, SERVICE_KONTROLL).map(
      (s) => s.key,
    );
    expect(keys).toEqual([
      'takk-for-bestillingen',
      'opprett-sjekklister',
      'epost-kommende-kontroll',
      'kontroll-dato',
      'gjennomgaa-rapport',
      'sluttrapport',
    ]);
  });

  it('filters Innhenting subset by step key', () => {
    const keys = filterStepsByService(WORKFLOW_STEPS, SERVICE_INNHENTING).map(
      (s) => s.key,
    );
    expect(keys).toEqual(['la-til-foretak', 'innhenting-av-dokumentasjon']);
  });

  it('returns all steps for unknown/empty service', () => {
    expect(filterStepsByService(WORKFLOW_STEPS, undefined)).toHaveLength(15);
    expect(filterStepsByService(WORKFLOW_STEPS, '')).toHaveLength(15);
    expect(filterStepsByService(WORKFLOW_STEPS, 'Annet')).toHaveLength(15);
  });
});
