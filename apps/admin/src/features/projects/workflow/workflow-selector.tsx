'use client';

/**
 * WorkflowSelector —— 多工作流(服务)选择器。
 *
 * 一个项目按 projectServiceWorkflowList 每个服务生成一条工作流实例;此处在多条之间切换。
 * 对齐旧 admin ProjectWorkplaceHeader 的 Service 下拉。只有一条工作流时由父组件隐藏。
 */
import { useTranslation } from 'react-i18next';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface WorkflowInstance {
  /** ServiceWorkflowCategory.id —— 实例唯一键(选择器 value)。 */
  instanceId: number;
  /** 工作流类别 ID —— 作为 GetProjectWorkflow* 的 WorkflowID 与各步请求体的 workflowId。 */
  workflowCategoryId: number;
  serviceId?: number;
  serviceName?: string;
  serviceDescription?: string;
  /** 展示名(服务名 – 描述)。 */
  label: string;
}

export function WorkflowSelector({
  instances,
  value,
  onChange,
}: {
  instances: WorkflowInstance[];
  value: number;
  onChange: (instanceId: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="wf-service-select" className="text-muted-foreground whitespace-nowrap text-xs">
        {t('workflow.selector.label')}
      </Label>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger id="wf-service-select" className="w-[260px]">
          <SelectValue placeholder={t('workflow.selector.placeholder')} />
        </SelectTrigger>
        <SelectContent>
          {instances.map((w) => (
            <SelectItem key={w.instanceId} value={String(w.instanceId)}>
              {w.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
