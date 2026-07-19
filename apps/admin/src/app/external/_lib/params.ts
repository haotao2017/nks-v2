/**
 * 外部参与方页面的 URL 参数解析与校验。
 *
 * 邮件里的链接携带鉴权/定位参数。后端 PartyDocController 的 @RequestParam 名为 PascalCase
 * (WorkflowId / ProjectID / PartyID / PartyTypeID / UrlKey / CKII),但邮件生成方的大小写可能
 * 不完全一致(旧前端用过 ProjectId)。因此这里对入参做大小写不敏感读取,内部统一为 camelCase,
 * 发往后端时再由各调用处映射回后端要求的 PascalCase(见 ./api.ts)。
 */

import type { ReadonlyURLSearchParams } from 'next/navigation';

/** 内部统一形状(camelCase)。 */
export interface PartyParams {
  workflowId: string;
  projectId: string;
  partyId: string;
  partyTypeId: string;
  urlKey: string;
  /** 检查项 ID(逗号分隔);仅 UpdateDeviation 需要。 */
  ckii: string;
}

/** 大小写不敏感取值:遍历 searchParams,按小写 key 匹配。 */
function pick(sp: URLSearchParams | ReadonlyURLSearchParams, name: string): string {
  const target = name.toLowerCase();
  for (const [k, v] of sp.entries()) {
    if (k.toLowerCase() === target) return v;
  }
  return '';
}

/** 旧 UploadDocs 硬编码的 UrlKey（重定向链路上未带 UrlKey 时使用）。 */
const LEGACY_UPLOAD_DOCS_URL_KEY = 'hZ8ygadsDaOLDSYS';

export function parsePartyParams(
  sp: URLSearchParams | ReadonlyURLSearchParams,
): PartyParams {
  // 旧 UploadDocs 重定向别名: prId → ProjectID; ID → PartyID
  const projectId = pick(sp, 'ProjectID') || pick(sp, 'prId');
  const partyId = pick(sp, 'PartyID') || pick(sp, 'ID');
  const partyTypeId = pick(sp, 'PartyTypeID');
  const urlKeyRaw = pick(sp, 'UrlKey');
  // 遗留重定向仅带 prId+ID+PartyTypeId，无 UrlKey → 使用旧 UploadDocs 硬编码 key
  const legacyRedirect =
    !urlKeyRaw && Boolean(pick(sp, 'prId') && pick(sp, 'ID') && partyTypeId);
  return {
    workflowId: pick(sp, 'WorkflowId') || '1',
    projectId,
    partyId,
    partyTypeId,
    urlKey: urlKeyRaw || (legacyRedirect ? LEGACY_UPLOAD_DOCS_URL_KEY : ''),
    ckii: pick(sp, 'CKII'),
  };
}

/**
 * 基础校验:鉴权与定位所需的最小字段。
 * 与旧前端一致以 UrlKey + PartyID + PartyTypeID 为准,并额外要求 ProjectID(后端所有接口必需)。
 */
export function isValidBaseParams(p: PartyParams): boolean {
  return Boolean(p.urlKey && p.partyId && p.partyTypeId && p.projectId);
}

/** UpdateDeviation 额外要求 CKII(检查项 ID)。 */
export function isValidDeviationParams(p: PartyParams): boolean {
  return isValidBaseParams(p) && Boolean(p.ckii);
}
