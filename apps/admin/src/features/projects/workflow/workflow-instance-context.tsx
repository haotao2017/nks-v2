'use client';

/**
 * 当前选中工作流实例的上下文 —— 各步骤 mutation 自动带上 serviceWorkflowCategoryId
 *（对齐旧 admin 每步 body.ServiceWorkflowCategoryID / selectedWorkflowId）。
 */
import * as React from 'react';

const WorkflowInstanceContext = React.createContext<{
  serviceWorkflowCategoryId?: number;
}>({});

export function WorkflowInstanceProvider({
  serviceWorkflowCategoryId,
  children,
}: {
  serviceWorkflowCategoryId?: number;
  children: React.ReactNode;
}) {
  const value = React.useMemo(
    () => ({ serviceWorkflowCategoryId }),
    [serviceWorkflowCategoryId],
  );
  return (
    <WorkflowInstanceContext.Provider value={value}>
      {children}
    </WorkflowInstanceContext.Provider>
  );
}

export function useServiceWorkflowCategoryId(): number | undefined {
  return React.useContext(WorkflowInstanceContext).serviceWorkflowCategoryId;
}

/** 合并实例 ID 到请求体片段（extra 可覆盖）。 */
export function withServiceWorkflowCategoryId(
  serviceWorkflowCategoryId: number | undefined,
  extra?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...(serviceWorkflowCategoryId != null ? { serviceWorkflowCategoryId } : {}),
    ...extra,
  };
}
