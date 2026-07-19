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
