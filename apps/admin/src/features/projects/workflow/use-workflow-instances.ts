'use client';

/**
 * useWorkflowInstances —— 从 project 派生工作流实例列表 + 当前选中(共享 hook)。
 *
 * 一个项目按 projectServiceWorkflowList(每服务一条)生成工作流实例;join projectService
 * 取服务名/描述作展示名。对齐旧 admin ProjectWorkplaceHeader 的 Service 下拉。
 *
 * 由详情页头部持有,选中的 workflowCategoryId 同时驱动:
 *   - 头部选择器(WorkflowSelector)
 *   - ProjectWorkflow(Arbeidsflyt):按 workflowCategoryId 拉进度/步骤,按服务 description 过滤
 *   - ProjectDocsPanel(Dokumenter):按 workflowCategoryId 组织文档
 * 三处共用同一个选中实例,避免各自独立派生导致不一致。
 *
 * 选中策略(对齐旧 admin):默认 workflowCategoryId===1 的实例,否则第一条。
 * 用 `selectedId ?? defaultId` 渲染期派生 activeId,不在 effect 内 setState(避免 React 19
 * set-state-in-effect 违规与级联渲染)。
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import type { ProjectDto } from '@nks/api-types';

import { WORKFLOW_ID } from './workflow-steps';
import type { WorkflowInstance } from './workflow-selector';

export interface UseWorkflowInstancesResult {
  /** 派生的工作流实例列表(始终 ≥1,无服务工作流时回退默认 Workflow 1)。 */
  instances: WorkflowInstance[];
  /** 当前选中实例键(instanceId)。 */
  selectedId: number | null;
  /** 切换选中实例。 */
  setSelectedId: (instanceId: number) => void;
  /** 当前选中实例(始终有值,至少为列表首项)。 */
  selected: WorkflowInstance;
}

export function useWorkflowInstances(project: ProjectDto | undefined): UseWorkflowInstancesResult {
  const { t } = useTranslation();

    const instances = React.useMemo<WorkflowInstance[]>(() => {
    const swcList = project?.projectServiceWorkflowList ?? [];
    const services = project?.projectService ?? [];
    const mapped = swcList
      .filter((swc) => swc.workflowCategoryId != null)
      .map((swc) => {
        const ps = services.find((s) => s.serviceId === swc.serviceId);
        const svc = ps?.service;
        const serviceName = svc?.name;
        const serviceDescription = svc?.description;
        const wfName =
          swc.workflowCategoryName ||
          t('workflow.selector.fallback', { id: swc.workflowCategoryId });
        // 同服务绑多条工作流时用工作流名区分,避免下拉两项显示完全一样。
        const label = serviceName
          ? `${serviceName}${serviceDescription ? ` – ${serviceDescription}` : ''} (${wfName})`
          : wfName;
        return {
          instanceId: swc.id ?? swc.workflowCategoryId!,
          workflowCategoryId: swc.workflowCategoryId!,
          serviceId: swc.serviceId,
          serviceName,
          serviceDescription,
          label,
        } satisfies WorkflowInstance;
      });
    if (mapped.length > 0) return mapped;
    // 回退:项目无服务工作流列表 → 默认 Workflow 1(全部步骤)。
    return [
      {
        instanceId: WORKFLOW_ID,
        workflowCategoryId: WORKFLOW_ID,
        label: t('workflow.selector.default'),
      },
    ];
  }, [project, t]);

  const defaultId =
    (instances.find((w) => w.workflowCategoryId === WORKFLOW_ID) ?? instances[0])?.instanceId ??
    null;
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const activeId = selectedId ?? defaultId;
  const selected = instances.find((w) => w.instanceId === activeId) ?? instances[0];

  return { instances, selectedId: activeId, setSelectedId, selected };
}
