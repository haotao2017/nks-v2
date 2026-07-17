'use client';

/**
 * 项目文档(Project Documents)数据访问层 —— 对应原系统 projectWorkplace/ProjectDocsApp.js。
 *
 * 三块能力,均挂在 ProjectDocController(基路径 /api/Project)下:
 *  - Foretak(按参与方):useProjectPartyDocGroups —— 逐参与方 GET
 *    /ProjectRequiredDocListBySingleParty?projectId&workflowId&partyId&partyTypeId,
 *    解包 res.projectDocumentList(每个文档类型一行:已上传行带 documentID/fileName/imageURL,
 *    未上传行带 isRequired,均带 documenTypeId/documentName)。
 *  - Generert(系统生成):useSystemGeneratedDocs —— GET
 *    /ProjectSystemGeneratedDocListAllSteps?projectId&workflowId,解包 res.projectDocumentList
 *    (每行带 workflowStepName + fileName + imageURL,imageURL 为 S3 直链,可下载)。
 *  - 上传 / 删除:useUploadProjectDocument(multipart,postForm)、useDeleteProjectDocument。
 *
 * 上传契约(见 controller ProjectUploadDocument):
 *  - multipart 字段:`request`(JSON 字符串,ProjectDocumentUploadDto)+ `file`(单个文件)。
 *    后端一次只收一个 `file`,多文件时按文件循环多次请求(对齐旧 submitDoc 的 Promise.all)。
 *  - request JSON 用小写 camelCase 键(后端 caseInsensitiveMapper 直解 ProjectDocumentUploadDto):
 *    projectId / workflowId / partyId / partyTypeId / documenTypeId / otherDocs。
 *  - Foretak 按文档类型上传带 partyId + partyTypeId + documenTypeId;
 *    参与方级通用上传带 partyId + partyTypeId(无 documenTypeId);Andre 通用上传带 otherDocs:2。
 *
 * 删除:DELETE /DeleteProjectDocument?documentId&projectId(均 camelCase query)。
 *
 * 说明:
 *  - workflowId 传入的是「工作流类别 ID」(workflowCategoryId,旧系统即以它作 WorkflowID);
 *    由面板从项目的 projectServiceWorkflowList 解析(见 project-docs-panel.tsx)。
 *  - 查询 key 以 root(projectId, workflowId) 为公共前缀,上传/删除后失效该前缀即刷新全部子查询。
 *  - 软失败(HTTP 200 + success:false)统一抛错,交由 useApiMutation 的 toast 处理。
 */
import { useQueries, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import type {
  ProjectDocumentDto,
  ProjectDocumentUploadDto,
  ProjectPartyDto,
  RequestResponse,
  WrapperProjectDocumentDto,
} from '@nks/api-types';
import { endpoints } from '@nks/api-types/endpoints';

import { getApiClient } from '@/lib/api';
import { useApiMutation } from '@/lib/query';

/** 项目文档查询 key。root 为公共前缀,写操作失效它即连带刷新 party / system 子查询。 */
export const projectDocKeys = {
  root: (projectId: number, workflowId: number) =>
    ['project-doc', projectId, workflowId] as const,
  party: (projectId: number, workflowId: number, partyTypeId: number, partyId: number) =>
    ['project-doc', projectId, workflowId, 'party', partyTypeId, partyId] as const,
  systemGenerated: (projectId: number, workflowId: number) =>
    ['project-doc', projectId, workflowId, 'system'] as const,
};

/** 一个参与方的文档分组(参与方信息 + 该参与方各文档类型行)。 */
export interface PartyDocGroup {
  party: ProjectPartyDto;
  docs: ProjectDocumentDto[];
  isLoading: boolean;
  isError: boolean;
}

// ── 查询 ────────────────────────────────────────────────────────────────

/**
 * Foretak —— 逐参与方拉取其文档类型清单(N 个 GET,useQueries)。
 * 参与方数通常很少,N+1 可接受(与 useProjectChecklistDetails 同构)。
 * workflowId<=0 或无参与方时各查询自动禁用。
 */
export function useProjectPartyDocGroups(
  projectId: number,
  workflowId: number,
  parties: ProjectPartyDto[],
): PartyDocGroup[] {
  const enabled = workflowId > 0;
  const results = useQueries({
    queries: parties.map((party) => ({
      queryKey: projectDocKeys.party(
        projectId,
        workflowId,
        party.partyTypeId ?? 0,
        party.partyId ?? 0,
      ),
      enabled,
      queryFn: async () => {
        const res = await getApiClient().get<WrapperProjectDocumentDto>(
          endpoints.projectDoc.requiredDocListBySingleParty.path,
          {
            params: {
              projectId,
              workflowId,
              partyId: party.partyId,
              partyTypeId: party.partyTypeId,
            },
          },
        );
        return res?.projectDocumentList ?? [];
      },
    })),
  });

  return parties.map((party, i) => ({
    party,
    docs: results[i]?.data ?? [],
    isLoading: results[i]?.isLoading ?? false,
    isError: results[i]?.isError ?? false,
  }));
}

/** Generert —— 系统生成文档(所有工作流步骤)。解包 res.projectDocumentList。 */
export function useSystemGeneratedDocs(projectId: number, workflowId: number) {
  return useQuery({
    queryKey: projectDocKeys.systemGenerated(projectId, workflowId),
    enabled: workflowId > 0,
    queryFn: async () => {
      const res = await getApiClient().get<WrapperProjectDocumentDto>(
        endpoints.projectDoc.systemGeneratedDocListAllSteps.path,
        { params: { projectId, workflowId } },
      );
      return res?.projectDocumentList ?? [];
    },
  });
}

// ── 写操作 ──────────────────────────────────────────────────────────────

/** 上传入参。files 可多个(逐个发请求);其余为 request JSON 字段。 */
export interface UploadDocVars {
  files: File[];
  partyId?: number;
  partyTypeId?: number;
  documenTypeId?: number;
  otherDocs?: number;
}

/**
 * 上传文档(multipart,postForm)。后端一次收一个 `file`,多文件按序循环上传。
 * 任一文件软失败(success:false)即抛错中断,交由 toast。成功失效 root 前缀。
 */
export function useUploadProjectDocument(projectId: number, workflowId: number) {
  const { t } = useTranslation();
  return useApiMutation<RequestResponse | undefined, UploadDocVars>({
    mutationFn: async ({ files, partyId, partyTypeId, documenTypeId, otherDocs }) => {
      const request: ProjectDocumentUploadDto = {
        projectId,
        workflowId,
        partyId,
        partyTypeId,
        documenTypeId,
        otherDocs,
      };
      let last: RequestResponse | undefined;
      for (const file of files) {
        const fd = new FormData();
        fd.append('request', JSON.stringify(request));
        fd.append('file', file);
        const res = await getApiClient().postForm<RequestResponse>(
          endpoints.projectDoc.uploadDocument.path,
          fd,
        );
        if (res && res.success === false) {
          throw new Error(res.message || t('docsPanel.toast.uploadError'));
        }
        last = res;
      }
      return last;
    },
    invalidateKeys: [projectDocKeys.root(projectId, workflowId)],
    successMessage: t('docsPanel.toast.uploaded'),
    errorMessage: t('docsPanel.toast.uploadError'),
  });
}

/** 删除已上传文档。query 参数 documentId + projectId。软失败抛错。 */
export function useDeleteProjectDocument(projectId: number, workflowId: number) {
  const { t } = useTranslation();
  return useApiMutation<RequestResponse, number>({
    mutationFn: async (documentId) => {
      const res = await getApiClient().delete<RequestResponse>(
        endpoints.projectDoc.deleteDocument.path,
        { params: { documentId, projectId } },
      );
      if (res?.success === false) {
        throw new Error(res.message || t('docsPanel.toast.deleteError'));
      }
      return res;
    },
    invalidateKeys: [projectDocKeys.root(projectId, workflowId)],
    successMessage: false,
    errorMessage: false,
    onSuccess: (data) => {
      toast.success(data?.message || t('docsPanel.toast.deleted'));
    },
  });
}
