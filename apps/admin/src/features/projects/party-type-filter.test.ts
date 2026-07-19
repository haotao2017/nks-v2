import { describe, expect, it } from 'vitest';

import {
  FORETAK_WORKFLOW_CATEGORY_ID,
  filterPartyTypesForForetak,
} from './party-type-filter';

describe('filterPartyTypesForForetak', () => {
  const types = [
    { id: 1, name: 'A', workflowCategoryID: 1 },
    { id: 2, name: 'B', workflowCategoryID: 2 },
    { id: 3, name: 'C', workflowCategoryID: 1 },
  ];

  it('keeps unbound only when category is 1', () => {
    const visible = filterPartyTypesForForetak(types, new Set());
    expect(visible.map((t) => t.id)).toEqual([1, 3]);
    expect(FORETAK_WORKFLOW_CATEGORY_ID).toBe(1);
  });

  it('always keeps already-bound types', () => {
    const visible = filterPartyTypesForForetak(types, new Set([2]));
    expect(visible.map((t) => t.id)).toEqual([1, 2, 3]);
  });
});
