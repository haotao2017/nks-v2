'use client';

/**
 * SimpleStepPanel —— 确认执行型步骤(WF5 sjekklister / WF6 foretak / WF7 påminnelse / WF11 gjennomgå rapport)。
 *
 * 大多只需点确认执行对应 ProjectWFxxx。两个特例:
 *  - step.dateField(WF7 påminnelse):附一个日期选择 → contactCustomerDate。
 *  - step.approve(WF11 gjennomgå rapport):执行时 isApprovedInspReport=true。
 * 注:旧 admin 里这些步骤(建清单/关联参与方/审阅清单项)有更丰富的管理界面,
 * 那些主数据操作在各自模块另有入口;此处按后端契约提供「触发 + 必要字段 + 结果」。
 */
import * as React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

import type { ProjectWorkflowDto } from '@nks/api-types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { WorkflowStepDef } from './workflow-steps';
import { useExecuteStepJson } from './workflow-api';

interface SimpleStepPanelProps {
  projectId: number;
  step: WorkflowStepDef;
  disabled?: boolean;
}

/** 今天的 date 输入字符串 YYYY-MM-DD。 */
function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 加 N 个月的 date 输入字符串。 */
function plusMonths(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function SimpleStepPanel({ projectId, step, disabled }: SimpleStepPanelProps) {
  const execMut = useExecuteStepJson(projectId, step, step.execute);
  const [date, setDate] = React.useState<string>(todayLocal());

  function handleSubmit() {
    const extra: Partial<ProjectWorkflowDto> = { isTransfer: false };
    if (step.dateField) extra.contactCustomerDate = date || undefined;
    if (step.approve) extra.isApprovedInspReport = true;
    execMut.mutate(extra as ProjectWorkflowDto);
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">{step.description}</p>

      {step.dateField && (
        <div className="space-y-2">
          <div className="space-y-1.5">
            <Label htmlFor="wf-reminder-date">Påminnelsesdato</Label>
            <Input
              id="wf-reminder-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'I dag', value: todayLocal() },
              { label: '+3 mnd', value: plusMonths(3) },
              { label: '+6 mnd', value: plusMonths(6) },
              { label: '+9 mnd', value: plusMonths(9) },
            ].map((q) => (
              <Button
                key={q.label}
                type="button"
                size="sm"
                variant="outline"
                disabled={disabled}
                onClick={() => setDate(q.value)}
              >
                {q.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <Button type="button" disabled={disabled || execMut.isPending} onClick={handleSubmit}>
        {execMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
        {step.approve ? 'Godkjenn og fullfør' : 'Bekreft og fullfør'}
      </Button>
    </div>
  );
}
