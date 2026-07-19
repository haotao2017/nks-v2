/**
 * 检验数据(InspData)API —— Gjennomgå rapport 步骤专用。
 *
 * 对齐旧 Wf1S12:
 *  - GET  /Project/GetAllProjectChecklistsInspData
 *  - PUT  /Project/UpdateSingleProjectChecklistItemInspData
 *  - DELETE /Project/DeleteSingleProjectChecklistItemImageInspData
 *  - POST /Project/GetProjectInspThirPartyEmailFormated
 *  - POST multipart /Project/ProjectInspThirPartySendEmail
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import type {
  ProjectChecklistInspDataDto,
  ProjectChecklistItemsInspDataDto,
  ProjectWorkflowDto,
  RequestResponse,
  WrapperMultiProjectChecklistInspDataDto,
  WrapperProjectChecklistItemInspDataDto,
  WrapperProjectWorkflowDto,
} from '@nks/api-types';
import { endpoints } from '@nks/api-types/endpoints';

import { getApiClient } from '@/lib/api';
import i18n from '@/lib/i18n';
import { useApiMutation } from '@/lib/query';

import { workflowKeys } from './workflow-api';

export const inspKeys = {
  all: (projectId: number) =>
    [...workflowKeys.all, 'insp-data', projectId] as const,
};

function assertOk(res: RequestResponse | undefined): RequestResponse {
  const ok = res?.success ?? res?.isSuccess;
  if (ok === false) {
    throw new Error(res?.message || i18n.t('workflow.errors.actionFailed'));
  }
  return res ?? {};
}

function unwrapWorkflow(res: unknown): ProjectWorkflowDto | undefined {
  if (!res || typeof res !== 'object') return undefined;
  const r = res as Record<string, unknown>;
  return (r.ProjectWorkflow ?? r.projectWorkflow) as ProjectWorkflowDto | undefined;
}

/** 拉全量检验清单数据。 */
export function useProjectChecklistsInspData(projectId: number) {
  return useQuery({
    queryKey: inspKeys.all(projectId),
    queryFn: async (): Promise<ProjectChecklistInspDataDto[]> => {
      const res = await getApiClient().get<WrapperMultiProjectChecklistInspDataDto>(
        endpoints.project.getAllChecklistsInspData.path,
        { params: { ProjectID: projectId } },
      );
      return res?.multiProjectChecklistInspData ?? [];
    },
    enabled: Number.isFinite(projectId) && projectId > 0,
  });
}

/** 更新单项 status/comment(旧 dialog 只发这些字段)。 */
export function useUpdateChecklistItemInspData(projectId: number) {
  const { t } = useTranslation();
  return useApiMutation<
    ProjectChecklistItemsInspDataDto | undefined,
    Pick<ProjectChecklistItemsInspDataDto, 'id' | 'checklistId' | 'status' | 'comment'>
  >({
    mutationFn: async (item) => {
      const res = await getApiClient().put<WrapperProjectChecklistItemInspDataDto>(
        endpoints.project.updateSingleChecklistItemInspData.path,
        {
          projectChecklistItemInspData: {
            id: item.id,
            checklistId: item.checklistId,
            status: item.status,
            comment: item.comment,
            wasDev: null,
          },
        },
      );
      return res?.projectChecklistItemInspData;
    },
    invalidateKeys: [inspKeys.all(projectId)],
    successMessage: t('workflow.inspect.toast.itemSaved'),
    errorMessage: false,
  });
}

/** 删除单项下某张检验图。 */
export function useDeleteChecklistItemImageInspData(projectId: number) {
  const { t } = useTranslation();
  return useApiMutation<RequestResponse, number>({
    mutationFn: async (imageId) => {
      const res = await getApiClient().delete<RequestResponse>(
        endpoints.project.deleteSingleChecklistItemImageInspData.path,
        { params: { ProjectChecklistItemImageId: imageId } },
      );
      return assertOk(res);
    },
    invalidateKeys: [inspKeys.all(projectId)],
    successMessage: t('workflow.inspect.toast.imageDeleted'),
    errorMessage: false,
  });
}

/** 预览第三方偏差邮件(按勾选的 checklist item ids)。 */
export function useInspThirdPartyEmailPreview() {
  return useApiMutation<
    ProjectWorkflowDto | undefined,
    { projectId: number; workflowId: number; workflowStepId: number; itemIds: number[] }
  >({
    mutationFn: async ({ projectId, workflowId, workflowStepId, itemIds }) => {
      const body: ProjectWorkflowDto = {
        projectId,
        workflowId,
        workflowStepId,
        isTransfer: false,
        checklistItemIdCommaSeperated: itemIds.join(','),
      };
      const res = await getApiClient().post<WrapperProjectWorkflowDto>(
        endpoints.projectDoc.getInspThirdPartyEmailFormated.path,
        { ProjectWorkflow: body },
      );
      return unwrapWorkflow(res);
    },
    successMessage: false,
    errorMessage: false,
  });
}

/** 发送第三方偏差邮件(multipart: request + file PDF)。 */
export function useInspThirdPartySendEmail(projectId: number) {
  const { t } = useTranslation();
  return useApiMutation<RequestResponse, { body: ProjectWorkflowDto; pdfBlob: Blob; fileName?: string }>({
    mutationFn: async ({ body, pdfBlob, fileName }) => {
      const form = new FormData();
      form.append('request', JSON.stringify({ ProjectWorkflow: body }));
      form.append('file', pdfBlob, fileName || 'deviation-report.pdf');
      const res = await getApiClient().postForm<RequestResponse>(
        endpoints.projectDoc.inspThirdPartySendEmail.path,
        form,
      );
      return assertOk(res);
    },
    invalidateKeys: [inspKeys.all(projectId)],
    successMessage: t('workflow.toast.emailSent'),
    errorMessage: false,
  });
}
