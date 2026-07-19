import { describe, expect, it } from 'vitest';

import { buildStepBase } from './workflow-api';

describe('buildStepBase', () => {
  it('includes serviceWorkflowCategoryId when provided', () => {
    const body = buildStepBase(
      10,
      { workflowId: 1, workflowStepId: 5 },
      { isTransfer: false },
      42,
    );
    expect(body).toMatchObject({
      projectId: 10,
      workflowId: 1,
      workflowStepId: 5,
      serviceWorkflowCategoryId: 42,
      isTransfer: false,
    });
  });

  it('lets extra override instance id', () => {
    const body = buildStepBase(
      10,
      { workflowId: 1, workflowStepId: 5 },
      { serviceWorkflowCategoryId: 99 },
      42,
    );
    expect(body.serviceWorkflowCategoryId).toBe(99);
  });
});
