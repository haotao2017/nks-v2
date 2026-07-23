'use client';

/**
 * SimpleStepPanel —— 确认执行型步骤(WF5 sjekklister / WF6 foretak / WF7 påminnelse)。
 *
 *  - step.dateField(WF7 påminnelse):项目负责人选择 + 日期 → contactCustomerDate。
 *  - step.approve:执行时 isApprovedInspReport=true(现已由 inspect-report 接管,保留兼容)。
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Loader2 } from 'lucide-react';

import type { ProjectWorkflowDto } from '@nks/api-types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { ProjectLeaderSection } from './project-leader-section';
import { useReminderDate } from './project-leader-api';
import type { WorkflowStepDef } from './workflow-steps';
import { useExecuteStepJson } from './workflow-api';
import { ProjectChecklistsPanel } from '../checklists-panel';
import { ProjectPartiesPanel } from '../parties-panel';

interface SimpleStepPanelProps {
  projectId: number;
  step: WorkflowStepDef;
  disabled?: boolean;
  onCompleted?: () => void;
}

/** datetime-local 字符串 YYYY-MM-DDTHH:mm（默认 09:00，对齐旧 DateTimePicker）。 */
function toDateTimeLocal(d: Date, hour = 9, minute = 0): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hour)}:${pad(minute)}`;
}

/** 今天的 datetime-local 输入字符串（09:00）。 */
function todayLocal(): string {
  return toDateTimeLocal(new Date());
}

/** 加 N 个月的 datetime-local 输入字符串（09:00）。 */
function plusMonths(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return toDateTimeLocal(d);
}

/** ISO/任意日期串 → datetime-local；无效则 today；已过期改今天 09:00。 */
function toDateTimeInput(value?: string | null): string {
  if (!value) return todayLocal();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return todayLocal();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // 旧系统:若已存日期早于今天,改用今天 09:00
  if (d < today) return todayLocal();
  return toDateTimeLocal(d, d.getHours(), d.getMinutes());
}

export function SimpleStepPanel({ projectId, step, disabled, onCompleted }: SimpleStepPanelProps) {
  const { t } = useTranslation();
  const execMut = useExecuteStepJson(projectId, step, step.execute);
  const reminderQuery = useReminderDate(step.dateField ? projectId : 0);
  const [date, setDate] = React.useState<string>(todayLocal());
  const [dateHydrated, setDateHydrated] = React.useState(false);

  React.useEffect(() => {
    if (!step.dateField || dateHydrated || reminderQuery.isPending) return;
    if (reminderQuery.data?.contactCustomerDate) {
      setDate(toDateTimeInput(reminderQuery.data.contactCustomerDate));
    }
    setDateHydrated(true);
  }, [step.dateField, reminderQuery.data, reminderQuery.isPending, dateHydrated]);

  function handleSubmit() {
    const extra: Partial<ProjectWorkflowDto> = { isTransfer: false };
    if (step.dateField) {
      // 旧系统发 ISO;后端 LocalDateTime 可解析带时间（datetime-local → Date → ISO）。
      const iso =
        date.length === 10
          ? new Date(`${date}T09:00:00`).toISOString()
          : new Date(date).toISOString();
      extra.contactCustomerDate = iso;
    }
    if (step.approve) extra.isApprovedInspReport = true;
    execMut.mutate(extra as ProjectWorkflowDto, { onSuccess: () => onCompleted?.() });
  }

  return (
    <div className="space-y-4">
      {step.descriptionKey && (
        <p className="text-muted-foreground text-sm">{t(step.descriptionKey)}</p>
      )}

      {step.key === 'opprett-sjekklister' && (
        <ProjectChecklistsPanel projectId={projectId} />
      )}
      {step.key === 'la-til-foretak' && <ProjectPartiesPanel projectId={projectId} />}

      {step.projectLeader && (
        <ProjectLeaderSection projectId={projectId} disabled={disabled} />
      )}

      {step.dateField && (
        <div className="space-y-2">
          <div className="space-y-1.5">
            <Label htmlFor="wf-reminder-date">{t('workflow.panel.reminderDate')}</Label>
            <Input
              id="wf-reminder-date"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { labelKey: 'workflow.panel.quick.today', value: todayLocal() },
              { labelKey: 'workflow.panel.quick.plus3', value: plusMonths(3) },
              { labelKey: 'workflow.panel.quick.plus6', value: plusMonths(6) },
              { labelKey: 'workflow.panel.quick.plus9', value: plusMonths(9) },
            ].map((q) => (
              <Button
                key={q.labelKey}
                type="button"
                size="sm"
                variant="outline"
                disabled={disabled}
                onClick={() => setDate(q.value)}
              >
                {t(q.labelKey)}
              </Button>
            ))}
          </div>
        </div>
      )}

      <Button type="button" disabled={disabled || execMut.isPending} onClick={handleSubmit}>
        {execMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
        {step.approve ? t('workflow.actions.approveAndComplete') : t('workflow.actions.confirmAndComplete')}
      </Button>
    </div>
  );
}
