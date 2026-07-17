'use client';

/**
 * 项目参与方(Deltakere / Foretak)关联数据访问层 —— 对应原系统 Wf1S7-la-til-foretak。
 *
 * 面板需要四组数据,三组直接复用现成 hook(避免重复实现),一组为本文件新增的写操作:
 *  - useProjectParties(projectId)  复用 ./api        GET  /Project/GetAllProjectPartiesByProjectID?ProjectID → 解包 res.multiProjectParty
 *  - usePartyTypes()               复用 party-types  GET  /PartyType/GetAllPartyType                        → 解包 res.multiPartyTypes
 *  - useContacts()                 复用 contacts     GET  /Contact/GetAllContact                            → 解包 res.multiContact
 *  - useAssociateProjectParty      本文件            POST /Project/AssociatePartyWithProjectPartyType       → RequestResponse{success,message}
 *
 * 关联端点契约(见 no.nks.controller.ProjectController#associatePartyWithProjectPartyType):
 *  - 请求体根键小写 `projectParty`(WrapperProjectPartyDto),形状 { projectId, partyId, partyTypeId }。
 *    partyId = 联系人(Contact)id;后端要求 partyId>0 && partyTypeId>0,否则直接返回失败。
 *  - 响应为 RequestResponse{success,message};重复关联等软失败为 HTTP 200 + success:false,
 *    这里判 success===false 抛错,交由 toast 用后端 message 统一提示(对齐 contacts/api.ts 的删除样板)。
 *  - 后端为「插入新关联」语义(不删旧行),故「更换」联系人与「新绑」走同一端点。
 */
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import type { RequestResponse, WrapperProjectPartyDto } from '@nks/api-types';
import { endpoints } from '@nks/api-types/endpoints';

import { getApiClient } from '@/lib/api';
import { useApiMutation } from '@/lib/query';

import { projectKeys } from './api';

// 复用现成 hook,给面板一个统一的 import 面。
export { useProjectParties } from './api';
export { usePartyTypes } from '@/features/party-types/api';
export { useContacts } from '@/features/contacts/api';

/**
 * 关联 / 更换 项目参与方与 party type。
 * body 根键小写 projectParty;成功后失效该项目的参与方列表缓存(projectKeys.parties)。
 */
export function useAssociateProjectParty(projectId: number) {
  const { t } = useTranslation();
  return useApiMutation<RequestResponse, { partyId: number; partyTypeId: number }>({
    mutationFn: async ({ partyId, partyTypeId }) => {
      const body: WrapperProjectPartyDto = {
        projectParty: { projectId, partyId, partyTypeId },
      };
      const res = await getApiClient().post<RequestResponse>(
        endpoints.project.associatePartyWithProjectPartyType.path,
        body,
      );
      if (res?.success === false) {
        throw new Error(res.message || t('partiesPanel.toast.associateError'));
      }
      return res;
    },
    invalidateKeys: [projectKeys.parties(projectId)],
    successMessage: false,
    errorMessage: false,
    onSuccess: (data) => {
      toast.success(data?.message || t('partiesPanel.toast.associated'));
    },
  });
}
