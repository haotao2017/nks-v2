'use client';

/**
 * WorkflowCategory 数据访问层 —— 照抄 features/contacts/api.ts,含分类 + 步骤两组 hooks。
 *
 * 分类端点(endpoints.workflowCategory.*):
 *  - useWorkflowCategories  GET    /GetAllWorkflowCategory        → 解包 res.multiWorkflowCategory
 *  - useCreateWorkflowCategory POST /CreatWorkflowCategory        → body { workflowCategory }, 解包 res.workflowCategory
 *  - useUpdateWorkflowCategory PUT  /UpdateWorkflowCategory       → body { workflowCategory }, 解包 res.workflowCategory
 *  - useDeleteWorkflowCategory DELETE /DeleteWorkflowCategory?WorkflowCategoryID → RequestResponse
 *
 * 步骤端点:
 *  - useWorkflowCategorySteps GET /GetWorkflowCategoryStepsForOneWorkflow?WorkflowCategoryID → 解包 res.multiWorkflowCategorySteps
 *  - useCreateWorkflowCategoryStep POST /CreatWorkflowCategoryStep → body { workflowCategoryStep }
 *  - useUpdateWorkflowCategoryStep PUT /UpdateSingleWorkflowCategoryStep → body { workflowCategoryStep }
 *  - useDeleteWorkflowCategoryStep DELETE /DeleteWorkflowCategoryStep?WorkflowCategoryStepID → RequestResponse
 *
 * 注意:
 *  - 请求体根键小写(workflowCategory / workflowCategoryStep),已核对 Java Wrapper DTO 无 @JsonProperty 覆盖。
 *  - 写操作后端限 SystemOwner(CompanyID==1),非 owner 返回 HTTP 400 + { success:false, message }。
 *    这里不前端预判,直接调用;失败由 useApiMutation 的 onError 用后端 message toast。
 *    (400 会被 NksClient 抛成 NksApiError,message 取自响应体。)
 */
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import type {
  WorkflowCategoryDto,
  WorkflowCategoryStepDto,
  WrapperWorkflowCategory,
  WrapperMultiWorkflowCategory,
  WrapperWorkflowCategoryStep,
  WrapperMultiWorkflowCategorySteps,
  RequestResponse,
} from '@nks/api-types';
import { endpoints } from '@nks/api-types/endpoints';

import { getApiClient } from '@/lib/api';
import { useApiMutation } from '@/lib/query';

/** 统一的查询 key —— 分类列表 + 每个分类下的步骤列表。 */
export const workflowCategoryKeys = {
  all: ['workflow-categories'] as const,
  list: () => [...workflowCategoryKeys.all, 'list'] as const,
  steps: (categoryId: number) =>
    [...workflowCategoryKeys.all, 'steps', categoryId] as const,
};

// ── 分类 ────────────────────────────────────────────────────────────────

/** 分类列表。解包 res.multiWorkflowCategory,空时回退 []。 */
export function useWorkflowCategories() {
  return useQuery({
    queryKey: workflowCategoryKeys.list(),
    queryFn: async () => {
      const res = await getApiClient().get<WrapperMultiWorkflowCategory>(
        endpoints.workflowCategory.getAll.path,
      );
      return res?.multiWorkflowCategory ?? [];
    },
  });
}

/** 创建分类。body 根键小写 workflowCategory;返回 res.workflowCategory。 */
export function useCreateWorkflowCategory() {
  const { t } = useTranslation();
  return useApiMutation<WorkflowCategoryDto | undefined, WorkflowCategoryDto>({
    mutationFn: async (workflowCategory) => {
      const body: WrapperWorkflowCategory = { workflowCategory };
      const res = await getApiClient().post<WrapperWorkflowCategory>(
        endpoints.workflowCategory.create.path,
        body,
      );
      return res?.workflowCategory;
    },
    invalidateKeys: [workflowCategoryKeys.list()],
    successMessage: t('workflowCategories.toast.created'),
    errorMessage: t('workflowCategories.toast.createError'),
  });
}

/** 更新分类。body 根键小写 workflowCategory;返回 res.workflowCategory。 */
export function useUpdateWorkflowCategory() {
  const { t } = useTranslation();
  return useApiMutation<WorkflowCategoryDto | undefined, WorkflowCategoryDto>({
    mutationFn: async (workflowCategory) => {
      const body: WrapperWorkflowCategory = { workflowCategory };
      const res = await getApiClient().put<WrapperWorkflowCategory>(
        endpoints.workflowCategory.update.path,
        body,
      );
      return res?.workflowCategory;
    },
    invalidateKeys: [workflowCategoryKeys.list()],
    successMessage: t('workflowCategories.toast.updated'),
    errorMessage: t('workflowCategories.toast.updateError'),
  });
}

/** 删除分类。query 参数 WorkflowCategoryID。非 owner 或占用时后端 400 抛错,统一 toast。 */
export function useDeleteWorkflowCategory() {
  const { t } = useTranslation();
  return useApiMutation<RequestResponse, number>({
    mutationFn: async (workflowCategoryId) => {
      return getApiClient().delete<RequestResponse>(
        endpoints.workflowCategory.delete.path,
        { params: { WorkflowCategoryID: workflowCategoryId } },
      );
    },
    invalidateKeys: [workflowCategoryKeys.list()],
    successMessage: t('workflowCategories.toast.deleted'),
    errorMessage: t('workflowCategories.toast.deleteError'),
  });
}

// ── 步骤 ────────────────────────────────────────────────────────────────

/** 某分类下的步骤列表。categoryId 为空时禁用查询。解包 res.multiWorkflowCategorySteps。 */
export function useWorkflowCategorySteps(categoryId: number | null) {
  return useQuery({
    queryKey: workflowCategoryKeys.steps(categoryId ?? 0),
    enabled: categoryId != null,
    queryFn: async () => {
      const res = await getApiClient().get<WrapperMultiWorkflowCategorySteps>(
        endpoints.workflowCategory.getStepsForOneWorkflow.path,
        { params: { WorkflowCategoryID: categoryId as number } },
      );
      return res?.multiWorkflowCategorySteps ?? [];
    },
  });
}

/** 创建步骤。body 根键小写 workflowCategoryStep;失效对应分类的步骤列表。 */
export function useCreateWorkflowCategoryStep(categoryId: number) {
  const { t } = useTranslation();
  return useApiMutation<WorkflowCategoryStepDto | undefined, WorkflowCategoryStepDto>({
    mutationFn: async (workflowCategoryStep) => {
      const body: WrapperWorkflowCategoryStep = { workflowCategoryStep };
      const res = await getApiClient().post<WrapperWorkflowCategoryStep>(
        endpoints.workflowCategory.createStep.path,
        body,
      );
      return res?.workflowCategoryStep;
    },
    invalidateKeys: [workflowCategoryKeys.steps(categoryId)],
    successMessage: t('workflowCategories.steps.toast.created'),
    errorMessage: t('workflowCategories.steps.toast.createError'),
  });
}

/** 更新步骤。body 根键小写 workflowCategoryStep。 */
export function useUpdateWorkflowCategoryStep(categoryId: number) {
  const { t } = useTranslation();
  return useApiMutation<WorkflowCategoryStepDto | undefined, WorkflowCategoryStepDto>({
    mutationFn: async (workflowCategoryStep) => {
      const body: WrapperWorkflowCategoryStep = { workflowCategoryStep };
      const res = await getApiClient().put<WrapperWorkflowCategoryStep>(
        endpoints.workflowCategory.updateSingleStep.path,
        body,
      );
      return res?.workflowCategoryStep;
    },
    invalidateKeys: [workflowCategoryKeys.steps(categoryId)],
    successMessage: t('workflowCategories.steps.toast.updated'),
    errorMessage: t('workflowCategories.steps.toast.updateError'),
  });
}

/** 删除步骤。query 参数 WorkflowCategoryStepID。 */
export function useDeleteWorkflowCategoryStep(categoryId: number) {
  const { t } = useTranslation();
  return useApiMutation<RequestResponse, number>({
    mutationFn: async (stepId) => {
      return getApiClient().delete<RequestResponse>(
        endpoints.workflowCategory.deleteStep.path,
        { params: { WorkflowCategoryStepID: stepId } },
      );
    },
    invalidateKeys: [workflowCategoryKeys.steps(categoryId)],
    successMessage: t('workflowCategories.steps.toast.deleted'),
    errorMessage: t('workflowCategories.steps.toast.deleteError'),
  });
}
