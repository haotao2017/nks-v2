'use client';

/**
 * 超级管理(Companies)数据访问层 —— 仅 SystemOwner 可用。
 * 照抄 features/contacts/api.ts 的单例 client + endpoints + useApiMutation 模式。
 *
 * 端点(来自 @nks/api-types 的 endpoints.company.*):
 *  - useSystemOwnerStatus  GET  /Company/CheckForSystemOwnerStatus → 裸 boolean(决定是否渲染管理区)
 *  - useAllCompanyProfiles GET  /Company/GetAllProfiles            → 解包 res.multiCompanyProfile(需 SystemOwner)
 *  - useAddCompany         PUT  /Company/AddNewCompanyProfile      → body { companyProfile },响应即 CompanyProfile
 *  - useCompanyProfileDetail GET /Company/GetProfile              → 解包 res.companyProfile(编辑回填)
 *  - useUpdateCompany      PUT  /Company/UpdateProfile             → body { companyProfile },响应即 CompanyProfile
 *  - useCreateCompanyUser  POST /UserProfile/CreateUserProfile     → body { userProfile },解包 res.userProfile(建管理员)
 *  - useCompanyFolder      GET  /Company/GetSingleCompanyFolder    → 裸 DocFolders | null
 *  - useAddCompanyFolder   PUT  /Company/AddCompanyFolder          → body { DocFolders },响应即 DocFolders
 *  - useUpdateCompanyFolder PUT /Company/UpdateSingleCompanyFolder → body { DocFolders },响应即 DocFolders
 *  - useBucketDetail       GET  /Company/GetBucketDetail           → 裸 S3Bucket
 *  - useUpdateBucket       PUT  /Company/UpdateS3Bucket            → body { S3bucket },响应即 S3Bucket
 *
 * 说明:
 *  - 权限判定只用 CheckForSystemOwnerStatus 决定是否渲染;其余接口的 403 等失败
 *    交由 useApiMutation / 查询错误态处理(toast 后端 message),不在前端预判。
 *  - GetAllProfiles 包装键 multiCompanyProfile(WrapperMultiCompanyProfile)。
 *  - endpoints.company 里还有 getAllFolders(GetAllCompaniesFolders),此处暂不接 UI,
 *    如需公司文件夹总览可按同样模式补 useAllCompaniesFolders。
 */
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import type {
  CompanyProfile,
  WrapperCompanyProfile,
  WrapperMultiCompanyProfile,
  S3Bucket,
  WrapperS3Bucket,
  DocFolders,
  WrapperDocFolders,
  CreateUserProfileDto,
  CreateUserProfileRequest,
  UserProfileDto,
} from '@nks/api-types';
import { endpoints } from '@nks/api-types/endpoints';

import { getApiClient } from '@/lib/api';
import { useApiMutation } from '@/lib/query';

/** GetProfile / Create / Update 用户响应:{ userProfile: UserProfileDto }。 */
interface WrapperUserProfileResponse {
  userProfile?: UserProfileDto;
}

export const companiesKeys = {
  all: ['companies'] as const,
  systemOwner: () => [...companiesKeys.all, 'system-owner'] as const,
  profiles: () => [...companiesKeys.all, 'profiles'] as const,
  bucket: () => [...companiesKeys.all, 'bucket'] as const,
  companyProfile: (id?: number) => [...companiesKeys.all, 'profile', id] as const,
  companyFolder: (id?: number) => [...companiesKeys.all, 'folder', id] as const,
};

/** 是否系统所有者。用于门禁渲染;失败(401/网络)不重试,视为非 owner。 */
export function useSystemOwnerStatus() {
  return useQuery({
    queryKey: companiesKeys.systemOwner(),
    retry: false,
    queryFn: async () => {
      const res = await getApiClient().get<boolean>(
        endpoints.company.checkSystemOwnerStatus.path,
      );
      return res === true;
    },
  });
}

/** 全部公司资料(需 SystemOwner)。解包 res.multiCompanyProfile,空时回退 []。 */
export function useAllCompanyProfiles(enabled = true) {
  return useQuery({
    queryKey: companiesKeys.profiles(),
    enabled,
    queryFn: async () => {
      const res = await getApiClient().get<WrapperMultiCompanyProfile>(
        endpoints.company.getAllProfiles.path,
      );
      return res?.multiCompanyProfile ?? [];
    },
  });
}

/** 新建公司。body 根键 companyProfile;响应即 CompanyProfile。需 SystemOwner。 */
export function useAddCompany() {
  const { t } = useTranslation();
  return useApiMutation<CompanyProfile, CompanyProfile>({
    mutationFn: async (companyProfile) => {
      const body: WrapperCompanyProfile = { companyProfile };
      return getApiClient().put<CompanyProfile>(endpoints.company.addNewProfile.path, body);
    },
    invalidateKeys: [companiesKeys.profiles()],
    successMessage: t('companies.toast.created'),
    errorMessage: t('companies.toast.createError'),
  });
}

/** 单个公司资料(编辑回填用)。CompanyID 为空时不触发,解包 res.companyProfile。 */
export function useCompanyProfileDetail(companyId?: number, enabled = true) {
  return useQuery({
    queryKey: companiesKeys.companyProfile(companyId),
    enabled: enabled && companyId != null,
    queryFn: async () => {
      const res = await getApiClient().get<WrapperCompanyProfile>(
        endpoints.company.getProfile.path,
        { params: { CompanyID: companyId } },
      );
      return res?.companyProfile ?? null;
    },
  });
}

/** 更新公司资料。body 根键 companyProfile;响应即 CompanyProfile。需 SystemOwner。 */
export function useUpdateCompany(companyId?: number) {
  const { t } = useTranslation();
  return useApiMutation<CompanyProfile, CompanyProfile>({
    mutationFn: async (companyProfile) => {
      const body: WrapperCompanyProfile = { companyProfile };
      return getApiClient().put<CompanyProfile>(endpoints.company.updateProfile.path, body);
    },
    invalidateKeys: [companiesKeys.profiles(), companiesKeys.companyProfile(companyId)],
    successMessage: t('companies.toast.updated'),
    errorMessage: t('companies.toast.updateError'),
  });
}

/**
 * 为公司创建管理员用户。body 根键 userProfile;返回 res.userProfile。需 ROLE_ADMIN。
 * isAdmin/isSystemOwner/companyId/userTypeId 等由调用方在 payload 内固定。
 */
export function useCreateCompanyUser() {
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
    successMessage: t('companies.toast.adminCreated'),
    errorMessage: t('companies.toast.adminCreateError'),
  });
}

/**
 * 单个公司的 S3 文件夹(DocFolders)。CompanyID 为空时不触发。
 * 后端 GetSingleCompanyFolder 要求 SystemOwner;无记录时回退 null。
 */
export function useCompanyFolder(companyId?: number, enabled = true) {
  return useQuery({
    queryKey: companiesKeys.companyFolder(companyId),
    enabled: enabled && companyId != null,
    retry: false,
    queryFn: async () =>
      getApiClient().get<DocFolders | null>(endpoints.company.getSingleFolder.path, {
        params: { CompanyID: companyId },
      }),
  });
}

/** 新建公司文件夹。body 根键 DocFolders;响应即 DocFolders。需 SystemOwner。 */
export function useAddCompanyFolder(companyId?: number) {
  const { t } = useTranslation();
  return useApiMutation<DocFolders, DocFolders>({
    mutationFn: async (docFolders) => {
      const body: WrapperDocFolders = { DocFolders: docFolders };
      return getApiClient().put<DocFolders>(endpoints.company.addFolder.path, body);
    },
    invalidateKeys: [companiesKeys.companyFolder(companyId)],
    successMessage: t('companies.toast.folderSaved'),
    errorMessage: t('companies.toast.folderSaveError'),
  });
}

/** 更新公司文件夹。body 根键 DocFolders;响应即 DocFolders。需 SystemOwner。 */
export function useUpdateCompanyFolder(companyId?: number) {
  const { t } = useTranslation();
  return useApiMutation<DocFolders, DocFolders>({
    mutationFn: async (docFolders) => {
      const body: WrapperDocFolders = { DocFolders: docFolders };
      return getApiClient().put<DocFolders>(endpoints.company.updateSingleFolder.path, body);
    },
    invalidateKeys: [companiesKeys.companyFolder(companyId)],
    successMessage: t('companies.toast.folderSaved'),
    errorMessage: t('companies.toast.folderSaveError'),
  });
}

/** S3 存储桶详情。仅在门禁通过后启用。 */
export function useBucketDetail(enabled = true) {
  return useQuery({
    queryKey: companiesKeys.bucket(),
    enabled,
    retry: false,
    queryFn: async () =>
      getApiClient().get<S3Bucket | null>(endpoints.company.getBucketDetail.path),
  });
}

/** 更新 S3 存储桶。body 根键 S3bucket;响应即 S3Bucket。需 SystemOwner。 */
export function useUpdateBucket() {
  const { t } = useTranslation();
  return useApiMutation<S3Bucket, S3Bucket>({
    mutationFn: async (bucket) => {
      const body: WrapperS3Bucket = { S3bucket: bucket };
      return getApiClient().put<S3Bucket>(endpoints.company.updateS3Bucket.path, body);
    },
    invalidateKeys: [companiesKeys.bucket()],
    successMessage: t('companies.toast.bucketUpdated'),
    errorMessage: t('companies.toast.bucketUpdateError'),
  });
}
