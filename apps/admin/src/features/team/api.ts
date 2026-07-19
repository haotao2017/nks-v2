'use client';

/**
 * Team 数据访问层 —— 覆盖 Bruker(用户)、Min profil(个人)、Selskap(公司资料/文件夹)。
 * 照抄 features/contacts/api.ts 的单例 client + endpoints + useApiMutation 模式。
 *
 * 端点(来自 @nks/api-types 的 endpoints.userProfile.* / endpoints.company.*):
 *  用户:
 *   - useUsers          GET    /UserProfile/GetAllUserProfile        → 解包 res.multiUserProfiles(需 ROLE_ADMIN)
 *   - useUserProfile    GET    /UserProfile/GetUserProfile?UserProfileID → 解包 res.userProfile
 *   - useCreateUser     POST   /UserProfile/CreateUserProfile         → body { userProfile },解包 res.userProfile(需 ROLE_ADMIN)
 *   - useUpdateUser     PUT    /UserProfile/UpdateUserProfile         → body { userProfile },解包 res.userProfile
 *   - useDeleteUser     DELETE /UserProfile/DeleteUserProfile?UserProfileID → { message, success }(需 ROLE_ADMIN)
 *  公司:
 *   - useCompanyProfile      GET GetProfile?CompanyID   → 解包 res.companyProfile(WrapperCompanyProfile)
 *   - useUpdateCompanyProfile PUT UpdateProfile         → body { companyProfile },响应即 CompanyProfile
 *   - useCompanyFolder       GET GetSingleCompanyFolder?CompanyID → DocFolders(后端要求 SystemOwner)
 *   - useUpdateCompanyFolder PUT UpdateSingleCompanyFolder → body { DocFolders },响应即 DocFolders
 *
 * 注意:
 *  - 后端包装键:GetAll→multiUserProfiles、Get/Create/Update→userProfile、公司→companyProfile。
 *    这些包装形状在 @nks/api-types 里无成品接口,用本地窄类型承接,不改契约包。
 *  - query 参数名区分大小写:UserProfileID、CompanyID(PascalCase)。
 *  - 密码为明文字段,前端只透传给后端(后端 BCrypt),不在前端加密。
 */
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import type {
  UserProfileDto,
  CreateUserProfileDto,
  CreateUserProfileRequest,
  UserProfileUpdateDto,
  UpdateUserProfileRequest,
  MessageSuccessResponse,
  CompanyProfile,
  DocFolders,
  WrapperDocFolders,
} from '@nks/api-types';
import { endpoints } from '@nks/api-types/endpoints';

import { getApiClient } from '@/lib/api';
import { useApiMutation } from '@/lib/query';

/* -------------------------------------------------------------------------- */
/* 本地窄类型:承接后端包装键(契约包暂无对应接口)。                          */
/* -------------------------------------------------------------------------- */

/** GetAllUserProfile 响应:{ multiUserProfiles: UserProfileDto[] }。 */
interface GetAllUserProfileResponse {
  multiUserProfiles?: UserProfileDto[];
}

/** GetUserProfile / Create / Update 响应:{ userProfile: UserProfileDto }。 */
interface WrapperUserProfileResponse {
  userProfile?: UserProfileDto;
}

/** GetProfile 响应:{ companyProfile: CompanyProfile }(WrapperCompanyProfile)。 */
interface WrapperCompanyProfileResponse {
  companyProfile?: CompanyProfile;
}

/* -------------------------------------------------------------------------- */
/* Query keys                                                                 */
/* -------------------------------------------------------------------------- */

export const teamKeys = {
  all: ['team'] as const,
  users: () => [...teamKeys.all, 'users'] as const,
  userProfile: (id?: number) => [...teamKeys.all, 'user', id] as const,
  companyProfile: (id?: number) => [...teamKeys.all, 'company', id] as const,
  companyFolder: (id?: number) => [...teamKeys.all, 'company-folder', id] as const,
};

/* -------------------------------------------------------------------------- */
/* 用户(Bruker)                                                              */
/* -------------------------------------------------------------------------- */

/** 用户列表。解包 res.multiUserProfiles,空时回退 []。 */
export function useUsers() {
  return useQuery({
    queryKey: teamKeys.users(),
    queryFn: async () => {
      const res = await getApiClient().get<GetAllUserProfileResponse>(
        endpoints.userProfile.getAll.path,
      );
      return res?.multiUserProfiles ?? [];
    },
  });
}

/** 单个用户资料。UserProfileID 为空时不触发。 */
export function useUserProfile(userProfileId?: number) {
  return useQuery({
    queryKey: teamKeys.userProfile(userProfileId),
    enabled: userProfileId != null,
    queryFn: async () => {
      const res = await getApiClient().get<WrapperUserProfileResponse>(
        endpoints.userProfile.get.path,
        { params: { UserProfileID: userProfileId } },
      );
      return res?.userProfile ?? null;
    },
  });
}

/** 创建用户。body 根键 userProfile;返回 res.userProfile。需 ROLE_ADMIN。 */
export function useCreateUser() {
  const { t } = useTranslation();
  return useApiMutation<UserProfileDto | undefined, CreateUserProfileDto>({
    mutationFn: async (userProfile) => {
      const body: CreateUserProfileRequest = { userProfile };
      const res = await getApiClient().post<WrapperUserProfileResponse>(
        endpoints.userProfile.create.path,
        body,
      );
      return res?.userProfile;
    },
    invalidateKeys: [teamKeys.users()],
    successMessage: t('team.toast.userCreated'),
    errorMessage: t('team.toast.userCreateError'),
  });
}

/** 更新用户。body 根键 userProfile;返回 res.userProfile。 */
export function useUpdateUser() {
  const { t } = useTranslation();
  return useApiMutation<UserProfileDto | undefined, UserProfileUpdateDto>({
    mutationFn: async (userProfile) => {
      const body: UpdateUserProfileRequest = { userProfile };
      const res = await getApiClient().put<WrapperUserProfileResponse>(
        endpoints.userProfile.update.path,
        body,
      );
      return res?.userProfile;
    },
    invalidateKeys: [teamKeys.users()],
    successMessage: t('team.toast.userUpdated'),
    errorMessage: t('team.toast.userUpdateError'),
  });
}

/** 删除用户。query 参数 UserProfileID;success=false 视为软失败。需 ROLE_ADMIN。 */
export function useDeleteUser() {
  const { t } = useTranslation();
  return useApiMutation<MessageSuccessResponse, number>({
    mutationFn: async (userProfileId) => {
      const res = await getApiClient().delete<MessageSuccessResponse>(
        endpoints.userProfile.delete.path,
        { params: { UserProfileID: userProfileId } },
      );
      if (res?.success === false) {
        throw new Error(res.message || t('team.toast.userDeleteBlocked'));
      }
      return res;
    },
    invalidateKeys: [teamKeys.users()],
    successMessage: false,
    errorMessage: false,
    onSuccess: (data) => {
      toast.success(t('team.toast.userDeleted'));
    },
  });
}

/* -------------------------------------------------------------------------- */
/* 个人资料 —— 复用 useUpdateUser(同一 UpdateUserProfile 端点)。            */
/* 编辑自己额外失效对应 userProfile 详情 key,保证 Min profil 即时刷新。      */
/* -------------------------------------------------------------------------- */

export function useUpdateMyProfile(userProfileId?: number) {
  const { t } = useTranslation();
  return useApiMutation<UserProfileDto | undefined, UserProfileUpdateDto>({
    mutationFn: async (userProfile) => {
      const body: UpdateUserProfileRequest = { userProfile };
      const res = await getApiClient().put<WrapperUserProfileResponse>(
        endpoints.userProfile.update.path,
        body,
      );
      return res?.userProfile;
    },
    invalidateKeys: [teamKeys.users(), teamKeys.userProfile(userProfileId)],
    successMessage: t('team.toast.profileUpdated'),
    errorMessage: t('team.toast.profileUpdateError'),
  });
}

/* -------------------------------------------------------------------------- */
/* 公司(Selskap)                                                            */
/* -------------------------------------------------------------------------- */

/** 公司资料。CompanyID 为空时不触发。解包 res.companyProfile。 */
export function useCompanyProfile(companyId?: number) {
  return useQuery({
    queryKey: teamKeys.companyProfile(companyId),
    enabled: companyId != null,
    queryFn: async () => {
      const res = await getApiClient().get<WrapperCompanyProfileResponse>(
        endpoints.company.getProfile.path,
        { params: { CompanyID: companyId } },
      );
      return res?.companyProfile ?? null;
    },
  });
}

/** 更新公司资料。body 根键 companyProfile;响应即 CompanyProfile。 */
export function useUpdateCompanyProfile(companyId?: number) {
  const { t } = useTranslation();
  return useApiMutation<CompanyProfile, CompanyProfile>({
    mutationFn: async (companyProfile) =>
      getApiClient().put<CompanyProfile>(endpoints.company.updateProfile.path, {
        companyProfile,
      }),
    invalidateKeys: [teamKeys.companyProfile(companyId)],
    successMessage: t('team.toast.companyProfileUpdated'),
    errorMessage: t('team.toast.companyProfileUpdateError'),
  });
}

/**
 * 公司文件夹。CompanyID 为空时不触发。
 * 注意:后端 GetSingleCompanyFolder 要求 SystemOwner,非 owner 会 403(由查询错误态体现)。
 */
export function useCompanyFolder(companyId?: number) {
  return useQuery({
    queryKey: teamKeys.companyFolder(companyId),
    enabled: companyId != null,
    retry: false,
    queryFn: async () =>
      getApiClient().get<DocFolders | null>(endpoints.company.getSingleFolder.path, {
        params: { CompanyID: companyId },
      }),
  });
}

/** 更新公司文件夹。body 根键 DocFolders;响应即 DocFolders。后端要求 SystemOwner。 */
export function useUpdateCompanyFolder(companyId?: number) {
  const { t } = useTranslation();
  return useApiMutation<DocFolders, DocFolders>({
    mutationFn: async (docFolders) => {
      const body: WrapperDocFolders = { DocFolders: docFolders };
      return getApiClient().put<DocFolders>(endpoints.company.updateSingleFolder.path, body);
    },
    invalidateKeys: [teamKeys.companyFolder(companyId)],
    successMessage: t('team.toast.folderUpdated'),
    errorMessage: t('team.toast.folderUpdateError'),
  });
}

/* -------------------------------------------------------------------------- */
/* 用户类型(Brukertype)选项 —— 对齐旧系统 userTypeId 语义。                 */
/* 1=Mobil kontroll app(移动检验),2=Desktop kontroll system,3=Begge。     */
/* 检验员(inspector)即通过 userTypeId 区分。                                */
/* -------------------------------------------------------------------------- */

export const USER_TYPE_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: 'Mobil kontroll app' },
  { value: 2, label: 'Desktop kontroll system' },
  { value: 3, label: 'Begge' },
];

export function userTypeLabel(userTypeId?: number): string {
  return USER_TYPE_OPTIONS.find((o) => o.value === userTypeId)?.label ?? '—';
}

/** 批量删除用户。 */
export function useBulkDeleteUsers() {
  const { t } = useTranslation();
  return useApiMutation<{ deleted: number }, number[]>({
    mutationFn: async (ids) => {
      let deleted = 0;
      for (const UserProfileID of ids) {
        const res = await getApiClient().delete<MessageSuccessResponse>(
          endpoints.userProfile.delete.path,
          { params: { UserProfileID } },
        );
        if (res?.success === false) {
          throw new Error(res.message || t('team.toast.userDeleteBlocked'));
        }
        deleted += 1;
      }
      return { deleted };
    },
    invalidateKeys: [teamKeys.users()],
    successMessage: false,
    errorMessage: false,
    onSuccess: (data) => {
      toast.success(t('team.toast.usersBulkDeleted', { count: data.deleted }));
    },
  });
}
