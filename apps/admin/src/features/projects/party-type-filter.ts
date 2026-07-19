import type { PartyTypeDto } from '@nks/api-types';

/** 旧 Wf1S7：仅 workflowCategoryID === 1 的类型出现在「待绑定」列表。 */
export const FORETAK_WORKFLOW_CATEGORY_ID = 1;

/**
 * 展示：已绑定的类型始终可见；未绑定的仅保留 workflowCategoryID === 1。
 */
export function filterPartyTypesForForetak(
  partyTypes: PartyTypeDto[],
  boundTypeIds: ReadonlySet<number>,
): PartyTypeDto[] {
  return partyTypes.filter((pt) => {
    if (pt.id != null && boundTypeIds.has(pt.id)) return true;
    return pt.workflowCategoryID === FORETAK_WORKFLOW_CATEGORY_ID;
  });
}
