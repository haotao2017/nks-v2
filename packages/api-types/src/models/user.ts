/**
 * 用户(User)域类型 —— 对齐 no.nks.dto.User* 系列 DTO。
 * 注意各 DTO 之间 companyId/companyID、userTypeId/userTypeID 的大小写差异,均忠实保留。
 */

/** 用户资料。companyId / userTypeId 小写驼峰。password 由服务层置空。 */
export interface UserProfileDto {
  id?: number;
  userName?: string;
  designation?: string;
  password?: string;
  userTypeId?: number;
  isActive?: boolean;
  picture?: string;
  contactId?: number;
  isAdmin?: boolean;
  fullName?: string;
  companyId?: number;
  isSystemOwner?: boolean;
}

/** 创建用户资料 DTO。 */
export interface CreateUserProfileDto {
  userName?: string;
  password?: string;
  userTypeId?: number;
  isActive?: boolean;
  contactId?: number;
  designation?: string;
  picture?: string;
  isAdmin?: boolean;
  fullName?: string;
  companyId?: number;
  isSystemOwner?: boolean;
}

/** 创建请求,根键 "userProfile"(@JsonProperty)。 */
export interface CreateUserProfileRequest {
  userProfile?: CreateUserProfileDto;
}

/** 更新请求,根键 "userProfile"(@JsonProperty)。 */
export interface UpdateUserProfileRequest {
  userProfile?: UserProfileUpdateDto;
}

/** 更新用户资料 DTO。password 为空/null 则不更新。 */
export interface UserProfileUpdateDto {
  id?: number;
  userName?: string;
  designation?: string;
  password?: string;
  userTypeId?: number;
  isActive?: boolean;
  picture?: string;
  contactId?: number;
  isAdmin?: boolean;
  fullName?: string;
  companyId?: number;
  isSystemOwner?: boolean;
}

/** 用户响应 DTO(隐藏敏感信息)。注意 userTypeID / companyID 为大写 D。 */
export interface UserDto {
  id?: number;
  fullName?: string;
  userName?: string;
  designation?: string;
  email?: string;
  userTypeID?: number;
  address?: string;
  contactNo?: string;
  isActive?: boolean;
  picture?: string;
  contactId?: number;
  isAdmin?: boolean;
  companyID?: number;
  isSystemOwner?: boolean;
}

/** 检查员用户 DTO。companyId / userTypeId 小写驼峰。 */
export interface UserInspectorDto {
  id?: number;
  designation?: string;
  userTypeId?: number;
  isActive?: boolean;
  contactId?: number;
  companyId?: number;
  fullName?: string;
}

/** 检查员配置 DTO。 */
export interface UserInspectorProfileDto {
  id?: number;
  name?: string;
  email?: string;
  contactNo?: string;
}

/** 检查员用户列表包装。 */
export interface WrapperMultiUserInspectorDto {
  multiUserInspectors?: UserInspectorDto[];
}

/** 检查员配置列表包装。 */
export interface WrapperMultiUserInspectorProfileDto {
  userInspectorProfiles?: UserInspectorProfileDto[];
}
