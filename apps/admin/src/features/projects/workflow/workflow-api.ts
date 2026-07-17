'use client';

/**
 * 项目工作流数据访问层 —— 汇总 endpoints.projectWorkflow.* + 少量 project.* 的 hooks。
 *
 * 约定:
 *  - 所有 ProjectWorkflow 请求体外层包装键为 PascalCase `ProjectWorkflow`(后端 @JsonProperty),
 *    内层字段用 camelCase(对齐 @nks/api-types 的 ProjectWorkflowDto = 后端 Java 字段名)。
 *  - GetXxxEmailFormated 响应解包 `res.ProjectWorkflow`(兼容 camelCase 回退)。
 *  - 执行/发送返回 RequestResponse{ success, message };HTTP 200 但 success:false 视为软失败,
 *    在 mutationFn 里抛错交给 useApiMutation.onError 用后端 message toast。
 *  - multipart(WF2/3/13/14)用 api-client.postForm:字段 `request`=JSON.stringify({ProjectWorkflow}),
 *    文件字段 `file`(单个)或 `files`(数组,仅 WF3)。
 */
import { useMutation, useQuery } from '@tanstack/react-query';

import type {
  ProjectWorkflowDto,
  WrapperProjectWorkflowDto,
  WrapperMultiProjectWorkflowDto,
  WrapperProjectInvoiceDataDto,
  WrapperMultiUserInspectorDto,
  RequestResponse,
} from '@nks/api-types';
import { endpoints } from '@nks/api-types/endpoints';

import { getApiClient } from '@/lib/api';
import { useApiMutation } from '@/lib/query';

import type { EndpointDescriptor, WorkflowStepDef } from './workflow-steps';

/** 统一查询 key。 */
export const workflowKeys = {
  all: ['project-workflow'] as const,
  progress: (projectId: number, workflowId: number) =>
    [...workflowKeys.all, 'progress', projectId, workflowId] as const,
  step: (projectId: number, workflowId: number, stepId: number) =>
    [...workflowKeys.all, 'step', projectId, workflowId, stepId] as const,
  inspectors: () => [...workflowKeys.all, 'inspectors'] as const,
  wfTenSaved: (projectId: number) => [...workflowKeys.all, 'wf-ten-saved', projectId] as const,
  invoice: (projectId: number) => [...workflowKeys.all, 'invoice', projectId] as const,
};

/** 构造某步的三元组基础请求体(projectId + workflowId + workflowStepId)。 */
export function buildStepBase(
  projectId: number,
  step: Pick<WorkflowStepDef, 'workflowId' | 'workflowStepId'>,
  extra?: Partial<ProjectWorkflowDto>,
): ProjectWorkflowDto {
  return {
    projectId,
    workflowId: step.workflowId,
    workflowStepId: step.workflowStepId,
    ...extra,
  };
}

function wrap(pw: ProjectWorkflowDto): WrapperProjectWorkflowDto {
  return { ProjectWorkflow: pw };
}

/** 解包 GetXxxEmailFormated 的响应(PascalCase 优先,camelCase 回退)。 */
function unwrapWorkflow(res: unknown): ProjectWorkflowDto | undefined {
  if (!res || typeof res !== 'object') return undefined;
  const r = res as Record<string, unknown>;
  return (r.ProjectWorkflow ?? r.projectWorkflow) as ProjectWorkflowDto | undefined;
}

/** RequestResponse 软失败判定:success===false 时抛错(用后端 message)。 */
function assertOk(res: RequestResponse | undefined): RequestResponse {
  const ok = res?.success ?? res?.isSuccess;
  if (ok === false) {
    throw new Error(res?.message || 'Handlingen mislyktes');
  }
  return res ?? {};
}

// ───────────────────────────── 进度读取 ─────────────────────────────

/**
 * 已完成/已推进步骤 —— GetProjectWorkflowCompletedTransferedSteps。
 * 返回 multiProjectWorkflow[](每项含 workflowStepId / isTransfer)。
 */
export function useWorkflowProgress(projectId: number, workflowId: number) {
  return useQuery({
    queryKey: workflowKeys.progress(projectId, workflowId),
    queryFn: async () => {
      const res = await getApiClient().get<WrapperMultiProjectWorkflowDto>(
        endpoints.projectWorkflow.getCompletedTransferedSteps.path,
        { params: { ProjectID: projectId, WorkflowID: workflowId } },
      );
      return res?.multiProjectWorkflow ?? [];
    },
    enabled: Number.isFinite(projectId) && projectId > 0,
  });
}

/** 当前步骤明细 —— GetProjectWorkflowStep。 */
export function useWorkflowStep(projectId: number, workflowId: number, stepId: number) {
  return useQuery({
    queryKey: workflowKeys.step(projectId, workflowId, stepId),
    queryFn: async () => {
      const res = await getApiClient().get<WrapperMultiProjectWorkflowDto>(
        endpoints.projectWorkflow.getWorkflowStep.path,
        { params: { ProjectID: projectId, WorkflowID: workflowId, WorkflowStepID: stepId } },
      );
      return res?.multiProjectWorkflow ?? [];
    },
    enabled: Number.isFinite(projectId) && projectId > 0,
  });
}

/** 检验员下拉数据 —— project.getInspectorUsers → multiUserInspectors。 */
export function useInspectors() {
  return useQuery({
    queryKey: workflowKeys.inspectors(),
    queryFn: async () => {
      const res = await getApiClient().get<WrapperMultiUserInspectorDto>(
        endpoints.project.getInspectorUsers.path,
      );
      return res?.multiUserInspectors ?? [];
    },
  });
}

/** WF10 已保存的检验详情(检验员/日期/备注/跳过)—— project.getWFTenSavedDetails。 */
export function useWfTenSavedDetails(projectId: number, enabled = true) {
  return useQuery({
    queryKey: workflowKeys.wfTenSaved(projectId),
    queryFn: async () => {
      const res = await getApiClient().get<Record<string, unknown>>(
        endpoints.project.getWFTenSavedDetails.path,
        { params: { ProjectID: projectId, WorkflowId: 1, WorkflowStepId: 10 } },
      );
      // 响应包装键在契约包无对应接口,窄取常见键。
      return (res?.projectWFTenSavedDetails ?? res) as {
        projectInspectorId?: number;
        projectInspectionDate?: string;
        projectInspectionEventComment?: string;
        projectSkipInspection?: boolean;
      } | null;
    },
    enabled: enabled && Number.isFinite(projectId) && projectId > 0,
  });
}

// ───────────────────────────── 邮件预览 ─────────────────────────────

/**
 * 取格式化邮件预览(POST GetXxxEmailFormated)。
 * 用 mutation:进入步骤时手动触发,返回 emailFrom/emailTo/emailSubject/emailContent/attachmentURL 等。
 */
export function useEmailPreview(previewEndpoint?: EndpointDescriptor) {
  return useMutation({
    mutationFn: async (body: ProjectWorkflowDto) => {
      if (!previewEndpoint) throw new Error('Ingen forhåndsvisning tilgjengelig for dette steget');
      const res = await getApiClient().post<WrapperProjectWorkflowDto>(previewEndpoint.path, wrap(body));
      return unwrapWorkflow(res);
    },
  });
}

// ───────────────────────────── 执行(JSON) ─────────────────────────────

/**
 * 执行一步(JSON 端点)—— 用于 email(wfXxx)、simple、pdf 非 multipart 等。
 * 成功后失效进度。
 */
export function useExecuteStepJson(
  projectId: number,
  step: WorkflowStepDef,
  endpoint: EndpointDescriptor | undefined,
  opts?: { successMessage?: string | false },
) {
  return useApiMutation<RequestResponse, ProjectWorkflowDto>({
    mutationFn: async (extra) => {
      if (!endpoint) throw new Error('Ingen handling definert for dette steget');
      const body = buildStepBase(projectId, step, extra);
      const res = await getApiClient().post<RequestResponse>(endpoint.path, wrap(body));
      return assertOk(res);
    },
    invalidateKeys: [workflowKeys.progress(projectId, step.workflowId)],
    successMessage: opts?.successMessage ?? 'Steget er utført',
    errorMessage: false, // 用后端 message
  });
}

// ───────────────────────────── 执行(multipart) ─────────────────────────────

interface MultipartVars {
  extra?: Partial<ProjectWorkflowDto>;
  files?: File[];
}

/**
 * 执行一步(multipart 端点,WF2/3/13/14)。
 * form: request=JSON.stringify({ProjectWorkflow}), 文件字段 `files`(step.multiFile)或 `file`(单个)。
 */
export function useExecuteStepMultipart(
  projectId: number,
  step: WorkflowStepDef,
  endpoint: EndpointDescriptor | undefined,
  opts?: { successMessage?: string | false },
) {
  return useApiMutation<RequestResponse, MultipartVars>({
    mutationFn: async ({ extra, files }) => {
      if (!endpoint) throw new Error('Ingen handling definert for dette steget');
      const body = buildStepBase(projectId, step, extra);
      const form = new FormData();
      form.append('request', JSON.stringify(wrap(body)));
      if (files?.length) {
        if (step.multiFile) {
          for (const f of files) form.append('files', f);
        } else {
          form.append('file', files[0]);
        }
      }
      const res = await getApiClient().postForm<RequestResponse>(endpoint.path, form);
      return assertOk(res);
    },
    invalidateKeys: [workflowKeys.progress(projectId, step.workflowId)],
    successMessage: opts?.successMessage ?? 'Steget er utført',
    errorMessage: false,
  });
}

// ───────────────────────────── 发信 / 推进 ─────────────────────────────

/** 发信(WF8/9 SendEmail;与 Transfer 分离)。 */
export function useSendEmail(
  projectId: number,
  step: WorkflowStepDef,
  endpoint: EndpointDescriptor | undefined,
) {
  return useApiMutation<RequestResponse, ProjectWorkflowDto>({
    mutationFn: async (extra) => {
      if (!endpoint) throw new Error('Ingen e-post-endepunkt definert for dette steget');
      const body = buildStepBase(projectId, step, { isTransfer: false, ...extra });
      const res = await getApiClient().post<RequestResponse>(endpoint.path, wrap(body));
      return assertOk(res);
    },
    invalidateKeys: [workflowKeys.progress(projectId, step.workflowId)],
    successMessage: 'E-post sendt',
    errorMessage: false,
  });
}

/** 推进(Transfer)—— 标记完成/跳过而不发信(isTransfer=true)。 */
export function useTransferStep(
  projectId: number,
  step: WorkflowStepDef,
  endpoint: EndpointDescriptor | undefined,
) {
  return useApiMutation<RequestResponse, void>({
    mutationFn: async () => {
      if (!endpoint) throw new Error('Ingen overførings-endepunkt definert for dette steget');
      const body = buildStepBase(projectId, step, { isTransfer: true });
      const res = await getApiClient().post<RequestResponse>(endpoint.path, wrap(body));
      return assertOk(res);
    },
    invalidateKeys: [workflowKeys.progress(projectId, step.workflowId)],
    successMessage: 'Steget er overført',
    errorMessage: false,
  });
}

// ───────────────────────────── 发票(WF15) ─────────────────────────────

/** 发票详情预览 —— POST ProjectWFFifteenGetDetails → projectInvoiceDataENT。 */
export function useInvoiceDetails(projectId: number, step: WorkflowStepDef, enabled = true) {
  return useQuery({
    queryKey: workflowKeys.invoice(projectId),
    queryFn: async () => {
      const body = buildStepBase(projectId, step);
      const res = await getApiClient().post<WrapperProjectInvoiceDataDto>(
        endpoints.projectWorkflow.wfFifteenGetDetails.path,
        wrap(body),
      );
      return res?.projectInvoiceDataENT ?? null;
    },
    enabled: enabled && Number.isFinite(projectId) && projectId > 0,
  });
}
