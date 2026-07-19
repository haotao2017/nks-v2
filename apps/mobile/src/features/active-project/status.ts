/**
 * 清单项状态 —— 与旧 kontoll-app / 后端落库值对齐。
 *
 * 线上存 OK / Dev / NA。后端写接口也会把 Avvik→Dev、IA→NA，读回始终是 Dev/NA。
 * UI 标签仍为 Godkjent / Avvik / I/A，但 value 必须用 wire 值，否则重开项目后选中态变空。
 */
export type ChecklistStatus = 'OK' | 'Dev' | 'NA';

/** 把任意历史/别名状态归一为 wire 值；未知则 null。 */
export function normalizeChecklistStatus(
  s?: string | null,
): ChecklistStatus | null {
  if (s === 'OK') return 'OK';
  if (s === 'Dev' || s === 'Avvik') return 'Dev';
  if (s === 'NA' || s === 'IA') return 'NA';
  return null;
}

/** OK / Dev 落状态前必须有图；NA 不要求。 */
export function statusRequiresPhoto(status: ChecklistStatus): boolean {
  return status === 'OK' || status === 'Dev';
}

/**
 * 选状态时：无图且需拍照 → pending；否则可直接写入。
 * NA 始终可直接写入（并清空图片由调用方处理）。
 */
export function shouldDeferStatusForPhoto(
  status: ChecklistStatus,
  imageCount: number,
): boolean {
  return statusRequiresPhoto(status) && imageCount === 0;
}

/** 删光图片后，若当前仍是 OK/Dev，应同步清掉状态。 */
export function shouldClearStatusAfterAllImagesRemoved(
  status: ChecklistStatus | null | undefined,
  remainingImageCount: number,
): boolean {
  return (
    remainingImageCount === 0 &&
    (status === 'OK' || status === 'Dev')
  );
}
