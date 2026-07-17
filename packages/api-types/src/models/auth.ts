/**
 * 认证域类型 —— 对齐 no.nks.dto.LoginRequestDto / LoginResponseDto。
 */

/** 登录请求。字段为 PascalCase(@JsonProperty)。 */
export interface LoginRequestDto {
  UserName?: string;
  Password?: string;
  IsMobileApp?: boolean;
}

/** 登录响应。注意 companyID 为大写 D。Password 有意省略。 */
export interface LoginResponseDto {
  id?: number;
  fullName?: string;
  userName?: string;
  token?: string;
  isAdmin?: boolean;
  isMobileApp?: boolean;
  companyID?: number;
}
