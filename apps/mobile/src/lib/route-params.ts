/** expo-router 动态路由参数可能是 string | string[]。 */
export type RouteParam = string | string[] | undefined;

export function normalizeRouteParam(value: RouteParam): string | undefined {
  if (value == null) return undefined;
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}
