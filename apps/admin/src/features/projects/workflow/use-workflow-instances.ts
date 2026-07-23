'use client';

/**
 * useWorkflowInstances —— 从 project 派生工作流实例列表 + 当前选中(共享 hook)。
 *
 * 一个项目按 projectServiceWorkflowList(每服务一条绑定)生成工作流实例;join projectService
 * 取服务名/描述作展示名。对齐旧 admin:只展示真实绑定,**无绑定时不伪造 Workflow 1**。
 *
 * 由详情页头部持有,选中的 workflowCategoryId 同时驱动:
 *   - 头部选择器(WorkflowSelector)
 *   - ProjectWorkflow(Arbeidsflyt)
 *   - ProjectDocsPanel(Dokumenter)
 *
 * 选中策略(对齐旧 admin):有绑定时优先 workflowCategoryId===1,否则第一条;无绑定则 selected=null。
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import type { ProjectDto } from '@nks/api-types';

import { WORKFLOW_ID } from './workflow-steps';
import type { WorkflowInstance } from './workflow-selector';

export interface UseWorkflowInstancesResult {
  /** 派生的工作流实例列表(可为空:服务未绑工作流时)。 */
  instances: WorkflowInstance[];
  /** 当前选中实例键(instanceId);无绑定时为 null。 */
  selectedId: number | null;
  /** 切换选中实例。 */
  setSelectedId: (instanceId: number) => void;
  /** 当前选中实例;无绑定时为 null。 */
  selected: WorkflowInstance | null;
}

export function useWorkflowInstances(project: ProjectDto | undefined): UseWorkflowInstancesResult {
  const { t } = useTranslation();

  const instances = React.useMemo<WorkflowInstance[]>(() => {
    const swcList = project?.projectServiceWorkflowList ?? [];
    const services = project?.projectService ?? [];
    return swcList
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
  }, [project, t]);

  const defaultId =
    (instances.find((w) => w.workflowCategoryId === WORKFLOW_ID) ?? instances[0])?.instanceId ??
    null;
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const activeId =
    selectedId != null && instances.some((w) => w.instanceId === selectedId)
      ? selectedId
      : defaultId;
  const selected = instances.find((w) => w.instanceId === activeId) ?? null;

  return { instances, selectedId: activeId, setSelectedId, selected };
}
