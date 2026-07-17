'use client';

/**
 * EmailTemplate 数据访问层 —— 照抄 features/contacts/api.ts 结构。
 *
 * 端点(来自 @nks/api-types 的 endpoints.emailTemplate.*):
 *  - useEmailTemplates    GET    /EmailTemplate/GetAllEmailTemplate     → 解包 res.multiEmailTemplates
 *  - useCreateEmailTemplate POST /EmailTemplate/CreatEmailTemplate      → body { emailTemplate }, 解包 res.emailTemplate
 *  - useUpdateEmailTemplate PUT  /EmailTemplate/UpdateEmailTemplate     → body { emailTemplate }, 解包 res.emailTemplate
 *  - useDeleteEmailTemplate DELETE /EmailTemplate/DeleteEmailTemplate?EmailTemplateID → { message, success }
 *  - useEmailHashtags     GET    /EmailTemplate/GetAllEmailHashtags     → string[](可插入的 #占位符# 列表)
 *
 * 注意:
 *  - 创建/更新请求体根键是小写 `emailTemplate`(后端 CreateEmailTemplateRequest 无 @JsonProperty 覆盖,
 *    与 Contact 的大写 `Contact` 不同,已核对 Java DTO)。
 *  - 删除响应形如 { message, success };这里 success=false 视为软失败并抛错。
 */
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import type {
  EmailTemplateDto,
  CreateEmailTemplateRequest,
  CreateEmailTemplateResponse,
  MultiEmailTemplatesResponse,
  DeleteEmailTemplateResponseDto,
} from '@nks/api-types';
import { endpoints } from '@nks/api-types/endpoints';

import { getApiClient } from '@/lib/api';
import { useApiMutation } from '@/lib/query';

/** 统一的查询 key —— 复用于失效重拉。 */
export const emailTemplateKeys = {
  all: ['email-templates'] as const,
  list: () => [...emailTemplateKeys.all, 'list'] as const,
  hashtags: () => [...emailTemplateKeys.all, 'hashtags'] as const,
};

/** 邮件模板列表。解包 res.multiEmailTemplates,空时回退 []。 */
export function useEmailTemplates() {
  return useQuery({
    queryKey: emailTemplateKeys.list(),
    queryFn: async () => {
      const res = await getApiClient().get<MultiEmailTemplatesResponse>(
        endpoints.emailTemplate.getAll.path,
      );
      return res?.multiEmailTemplates ?? [];
    },
  });
}

/**
 * 可插入的 #占位符# 列表(如 #CustomerName#)。返回字符串数组。
 * staleTime 拉长:占位符基本不变,避免每次开弹窗都重拉。
 */
export function useEmailHashtags() {
  return useQuery({
    queryKey: emailTemplateKeys.hashtags(),
    queryFn: async () => {
      const res = await getApiClient().get<string[]>(
        endpoints.emailTemplate.getAllHashtags.path,
      );
      return res ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** 创建邮件模板。body 根键小写 emailTemplate;返回 res.emailTemplate。 */
export function useCreateEmailTemplate() {
  return useApiMutation<EmailTemplateDto | undefined, EmailTemplateDto>({
    mutationFn: async (emailTemplate) => {
      const body: CreateEmailTemplateRequest = { emailTemplate };
      const res = await getApiClient().post<CreateEmailTemplateResponse>(
        endpoints.emailTemplate.create.path,
        body,
      );
      return res?.emailTemplate;
    },
    invalidateKeys: [emailTemplateKeys.list()],
    successMessage: 'E-postmal opprettet',
    errorMessage: 'Kunne ikke opprette e-postmal',
  });
}

/** 更新邮件模板。body 根键小写 emailTemplate;返回 res.emailTemplate。 */
export function useUpdateEmailTemplate() {
  return useApiMutation<EmailTemplateDto | undefined, EmailTemplateDto>({
    mutationFn: async (emailTemplate) => {
      const body: CreateEmailTemplateRequest = { emailTemplate };
      const res = await getApiClient().put<CreateEmailTemplateResponse>(
        endpoints.emailTemplate.update.path,
        body,
      );
      return res?.emailTemplate;
    },
    invalidateKeys: [emailTemplateKeys.list()],
    successMessage: 'E-postmal oppdatert',
    errorMessage: 'Kunne ikke oppdatere e-postmal',
  });
}

/**
 * 删除邮件模板。query 参数 EmailTemplateID。
 * 后端返回 { message, success };success=false 时抛错,统一用后端 message 提示。
 */
export function useDeleteEmailTemplate() {
  return useApiMutation<DeleteEmailTemplateResponseDto, number>({
    mutationFn: async (emailTemplateId) => {
      const res = await getApiClient().delete<DeleteEmailTemplateResponseDto>(
        endpoints.emailTemplate.delete.path,
        { params: { EmailTemplateID: emailTemplateId } },
      );
      if (res?.success === false) {
        throw new Error(res.message || 'E-postmalen kan ikke slettes');
      }
      return res;
    },
    invalidateKeys: [emailTemplateKeys.list()],
    successMessage: false,
    errorMessage: false,
    onSuccess: (data) => {
      toast.success(data?.message || 'E-postmal slettet');
    },
  });
}
