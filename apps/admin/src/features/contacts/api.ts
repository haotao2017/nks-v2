'use client';

/**
 * Contact 数据访问层 —— 每个主数据模块照抄此文件结构。
 *
 * 端点(来自 @nks/api-types 的 endpoints.contact.*):
 *  - useContacts       GET    /Contact/GetAllContact          → 解包 res.multiContact
 *  - useCreateContact  POST   /Contact/CreatContact           → body { Contact }, 解包 res.contact
 *  - useUpdateContact  PUT    /Contact/UpdateContact          → body { Contact }, 响应即 ContactDto
 *  - useDeleteContact  DELETE /Contact/DeleteContact?contactId → { message, success }; success=false 视为软失败
 *
 * 注意:
 *  - 创建/更新请求体的根键是大写 `Contact`(后端 @JsonProperty)。
 *  - GetAllContact 的响应包装键 `multiContact` 在 @nks/api-types 里暂无对应接口,
 *    这里用本地窄类型 GetAllContactResponse 承接,不改动契约包。
 */
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import type {
  ContactDto,
  CreateContactRequest,
  CreateContactResponse,
  UpdateContactRequest,
  DeleteContactResponseDto,
} from '@nks/api-types';
import { endpoints } from '@nks/api-types/endpoints';

import { getApiClient } from '@/lib/api';
import { useApiMutation } from '@/lib/query';

/** GetAllContact 的响应形状:{ multiContact: ContactDto[] }。 */
interface GetAllContactResponse {
  multiContact?: ContactDto[];
}

/** 统一的查询 key —— 复用于失效重拉。 */
export const contactKeys = {
  all: ['contacts'] as const,
  list: () => [...contactKeys.all, 'list'] as const,
};

/** 联系人列表。解包 res.multiContact,空时回退 []。 */
export function useContacts() {
  return useQuery({
    queryKey: contactKeys.list(),
    queryFn: async () => {
      const res = await getApiClient().get<GetAllContactResponse>(
        endpoints.contact.getAll.path,
      );
      return res?.multiContact ?? [];
    },
  });
}

/** 创建联系人。body 根键大写 Contact;返回 res.contact。 */
export function useCreateContact() {
  const { t } = useTranslation();
  return useApiMutation<ContactDto | undefined, ContactDto>({
    mutationFn: async (contact) => {
      const body: CreateContactRequest = { Contact: contact };
      const res = await getApiClient().post<CreateContactResponse>(
        endpoints.contact.create.path,
        body,
      );
      return res?.contact;
    },
    invalidateKeys: [contactKeys.list()],
    successMessage: t('contacts.toast.created'),
    errorMessage: t('contacts.toast.createError'),
  });
}

/** 更新联系人。body 根键大写 Contact;响应即 ContactDto。 */
export function useUpdateContact() {
  const { t } = useTranslation();
  return useApiMutation<ContactDto, ContactDto>({
    mutationFn: async (contact) => {
      const body: UpdateContactRequest = { Contact: contact };
      return getApiClient().put<ContactDto>(endpoints.contact.update.path, body);
    },
    invalidateKeys: [contactKeys.list()],
    successMessage: t('contacts.toast.updated'),
    errorMessage: t('contacts.toast.updateError'),
  });
}

/**
 * 删除联系人。query 参数 contactId。
 * 后端返回 { message, success };success=false(如被项目占用)时抛错,
 * 交由 useApiMutation 的 onError 统一 toast(errorMessage 关闭,直接用后端 message)。
 */
export function useDeleteContact() {
  const { t } = useTranslation();
  return useApiMutation<DeleteContactResponseDto, number>({
    mutationFn: async (contactId) => {
      const res = await getApiClient().delete<DeleteContactResponseDto>(
        endpoints.contact.delete.path,
        { params: { contactId } },
      );
      if (res?.success === false) {
        throw new Error(res.message || t('contacts.toast.deleteBlocked'));
      }
      return res;
    },
    invalidateKeys: [contactKeys.list()],
    successMessage: false, // 用后端返回的 message 提示
    errorMessage: false,
    onSuccess: (data) => {
      toast.success(data?.message || t('contacts.toast.deleted'));
    },
  });
}
