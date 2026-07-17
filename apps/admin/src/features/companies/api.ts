'use client';

/**
 * 超级管理(Companies)数据访问层 —— 仅 SystemOwner 可用。
 * 照抄 features/contacts/api.ts 的单例 client + endpoints + useApiMutation 模式。
 *
 * 端点(来自 @nks/api-types 的 endpoints.company.*):
 *  - useSystemOwnerStatus  GET  /Company/CheckForSystemOwnerStatus → 裸 boolean(决定是否渲染管理区)
 *  - useAllCompanyProfiles GET  /Company/GetAllProfiles            → 解包 res.multiCompanyProfile(需 SystemOwner)
 *  - useAddCompany         PUT  /Company/AddNewCompanyProfile      → body { companyProfile },响应即 CompanyProfile
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

import type {
  CompanyProfile,
  WrapperCompanyProfile,
  WrapperMultiCompanyProfile,
  S3Bucket,
  WrapperS3Bucket,
} from '@nks/api-types';
import { endpoints } from '@nks/api-types/endpoints';

import { getApiClient } from '@/lib/api';
import { useApiMutation } from '@/lib/query';

export const companiesKeys = {
  all: ['companies'] as const,
  systemOwner: () => [...companiesKeys.all, 'system-owner'] as const,
  profiles: () => [...companiesKeys.all, 'profiles'] as const,
  bucket: () => [...companiesKeys.all, 'bucket'] as const,
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
  return useApiMutation<CompanyProfile, CompanyProfile>({
    mutationFn: async (companyProfile) => {
      const body: WrapperCompanyProfile = { companyProfile };
      return getApiClient().put<CompanyProfile>(endpoints.company.addNewProfile.path, body);
    },
    invalidateKeys: [companiesKeys.profiles()],
    successMessage: 'Selskap opprettet',
    errorMessage: 'Kunne ikke opprette selskap',
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
  return useApiMutation<S3Bucket, S3Bucket>({
    mutationFn: async (bucket) => {
      const body: WrapperS3Bucket = { S3bucket: bucket };
      return getApiClient().put<S3Bucket>(endpoints.company.updateS3Bucket.path, body);
    },
    invalidateKeys: [companiesKeys.bucket()],
    successMessage: 'S3-bøtte oppdatert',
    errorMessage: 'Kunne ikke oppdatere S3-bøtte',
  });
}
