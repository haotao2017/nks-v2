/**
 * 认证数据访问层。
 *
 * 端点:
 *  - 登录:POST /users/Authenticate,body { UserName, Password, IsMobileApp: true }
 *          → LoginResponseDto{ id, token, userName, fullName, isAdmin, companyID }(扁平,无包装)。
 *  - 续登校验:GET /UserProfile/GetUserProfile?UserProfileID=<id>
 *          → { userProfile: UserProfileDto }(包装键小写 userProfile)。
 *
 * 说明(与旧移动端契约的差异,见任务报告):
 *  - 旧客户端登录 body 只发 { UserName, Password },不发 IsMobileApp。
 *    本次按新后端契约要求发 IsMobileApp: true(移动端标识)。
 */
import type {
  LoginRequestDto,
  LoginResponseDto,
  UserProfileDto,
} from '@nks/api-types';
import { endpoints } from '@nks/api-types/endpoints';

import { getApiClient } from '@/lib/api';
import { setToken } from '@/lib/secure-token';
import type { StoredUser } from '@/store/auth-slice';

export interface LoginInput {
  userName: string;
  password: string;
}

/** GetUserProfile 响应包装。 */
interface GetUserProfileResponse {
  userProfile?: UserProfileDto;
}

/** LoginResponseDto → StoredUser 摘要。 */
function toStoredUserFromLogin(res: LoginResponseDto): StoredUser {
  return {
    id: res.id,
    fullName: res.fullName,
    userName: res.userName,
    isAdmin: res.isAdmin,
    companyID: res.companyID,
  };
}

/** UserProfileDto → StoredUser 摘要(注意 companyId 小写 d → companyID)。 */
function toStoredUserFromProfile(p: UserProfileDto): StoredUser {
  return {
    id: p.id,
    fullName: p.fullName,
    userName: p.userName,
    isAdmin: p.isAdmin,
    companyID: p.companyId,
  };
}

/**
 * 登录。成功后把 token 写入 SecureStore,返回用户摘要供 dispatch。
 * 失败(含凭据错误)抛出 NksApiError。
 */
export async function login({
  userName,
  password,
}: LoginInput): Promise<StoredUser> {
  const body: LoginRequestDto = {
    UserName: userName,
    Password: password,
    IsMobileApp: true,
  };
  const res = await getApiClient().post<LoginResponseDto>(
    endpoints.auth.authenticate.path,
    body,
  );
  if (!res?.token) {
    throw new Error('Innlogging feilet: mangler token');
  }
  await setToken(res.token);
  return toStoredUserFromLogin(res);
}

/**
 * 用已存的 token 续登:拉 GetUserProfile 校验 token 是否仍有效。
 * 成功返回用户摘要;token 失效时 api-client 会触发 401 → onUnauthorized 清 token。
 */
export async function fetchUserProfile(userId: number): Promise<StoredUser> {
  const res = await getApiClient().get<GetUserProfileResponse>(
    endpoints.userProfile.get.path,
    { params: { UserProfileID: userId } },
  );
  if (!res?.userProfile) {
    throw new Error('Kunne ikke hente brukerprofil');
  }
  return toStoredUserFromProfile(res.userProfile);
}
