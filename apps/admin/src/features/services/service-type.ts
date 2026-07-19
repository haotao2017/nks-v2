/**
 * 服务 Tiltaksklasse 编码 —— 对齐旧 Fuse serviceApp（Ingen = 3）。
 * UI 用哨兵「none」；落库必须是 3（PDF 用 != 3 过滤，null 会 NPE）。
 */
export const SERVICE_TYPE_NONE_FORM = 'none';
export const SERVICE_TYPE_NONE_ID = 3;

/** 编辑回填：3 / 缺失 → none；新建默认 1。 */
export function hydrateServiceTypeFormValue(
  serviceTypeId: number | undefined | null,
  isEdit: boolean,
): string {
  if (!isEdit) return '1';
  if (serviceTypeId == null || serviceTypeId === SERVICE_TYPE_NONE_ID) {
    return SERVICE_TYPE_NONE_FORM;
  }
  return String(serviceTypeId);
}

/** 提交：none → 3；其余为数字。非法时回退 3（Ingen）。 */
export function encodeServiceTypeFormValue(formValue: string): number {
  if (formValue === SERVICE_TYPE_NONE_FORM) return SERVICE_TYPE_NONE_ID;
  const n = Number(formValue);
  return Number.isNaN(n) ? SERVICE_TYPE_NONE_ID : n;
}
