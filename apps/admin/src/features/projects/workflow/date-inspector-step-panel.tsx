'use client';

/**
 * DateInspectorStepPanel —— WF10「Kontroll-dato」:设检验日期 + 指派检验员。
 *
 * 字段:projectInspectorId(检验员下拉,project.getInspectorUsers)、
 * projectInspectionDate(日期时间)、projectInspectionEventComment(备注)、
 * projectSkipInspection(跳过检验开关)、isInspectorEmail(给检验员发日历邀请/ICS)。
 * 进入时用 project.getWFTenSavedDetails 回填。
 * 执行 ProjectWFTen(勾选跳过时检验员/日期置空、projectSkipInspection=true);
 * 「Overfør」走 ProjectWFTenTransfer。ICS 日历邀请由后端在 isInspectorEmail=true 时生成。
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarClock, Send, FastForward, Loader2 } from 'lucide-react';

import type { ProjectWorkflowDto } from '@nks/api-types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { WorkflowStepDef } from './workflow-steps';
import {
  useExecuteStepJson,
  useInspectors,
  useTransferStep,
  useWfTenSavedDetails,
} from './workflow-api';

interface DateInspectorStepPanelProps {
  projectId: number;
  step: WorkflowStepDef;
  disabled?: boolean;
}

/** 默认明天 09:00 的 datetime-local 字符串。 */
function tomorrowNineLocal(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** ISO 字符串 → datetime-local(截到分钟)。 */
function toLocalInput(iso?: string): string {
  if (!iso) return '';
  return iso.length >= 16 ? iso.slice(0, 16) : iso;
}

export function DateInspectorStepPanel({ projectId, step, disabled }: DateInspectorStepPanelProps) {
  const { t } = useTranslation();
  const inspectors = useInspectors();
  const saved = useWfTenSavedDetails(projectId);
  const execMut = useExecuteStepJson(projectId, step, step.execute, {
    successMessage: t('workflow.toast.inspectionDateSaved'),
  });
  const transferMut = useTransferStep(projectId, step, step.transfer);

  const [inspectorId, setInspectorId] = React.useState<string>('');
  const [date, setDate] = React.useState<string>(tomorrowNineLocal());
  const [comment, setComment] = React.useState('');
  const [skip, setSkip] = React.useState(false);
  const [notifyInspector, setNotifyInspector] = React.useState(true);
  const [hydrated, setHydrated] = React.useState(false);

  // 回填已保存详情(仅一次)。
  React.useEffect(() => {
    if (hydrated || saved.isPending) return;
    const d = saved.data;
    if (d) {
      if (d.projectInspectorId) setInspectorId(String(d.projectInspectorId));
      if (d.projectInspectionDate) setDate(toLocalInput(d.projectInspectionDate));
      if (d.projectInspectionEventComment) setComment(d.projectInspectionEventComment);
      if (typeof d.projectSkipInspection === 'boolean') setSkip(d.projectSkipInspection);
    }
    setHydrated(true);
  }, [saved.data, saved.isPending, hydrated]);

  const inspectorOptions = (inspectors.data ?? []).filter((u) => u.contactId != null);
  const busy = execMut.isPending || transferMut.isPending;

  function handleSubmit() {
    const extra: Partial<ProjectWorkflowDto> = skip
      ? {
          isTransfer: false,
          projectSkipInspection: true,
          projectInspectorId: undefined,
          projectInspectionDate: undefined,
          projectInspectionEventComment: undefined,
          isInspectorEmail: false,
        }
      : {
          isTransfer: false,
          projectSkipInspection: false,
          projectInspectorId: inspectorId ? Number(inspectorId) : undefined,
          projectInspectionDate: date || undefined,
          projectInspectionEventComment: comment || undefined,
          isInspectorEmail: notifyInspector,
        };
    execMut.mutate(extra as ProjectWorkflowDto);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-md border p-3">
        <div>
          <p className="text-sm font-medium">{t('workflow.panel.skipInspection')}</p>
          <p className="text-muted-foreground text-xs">{t('workflow.panel.skipInspectionHint')}</p>
        </div>
        <Switch checked={skip} onCheckedChange={setSkip} disabled={disabled} />
      </div>

      {!skip && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="wf-inspector">{t('workflow.panel.inspector')}</Label>
            <Select value={inspectorId} onValueChange={setInspectorId} disabled={disabled || inspectors.isPending}>
              <SelectTrigger id="wf-inspector">
                <SelectValue
                  placeholder={
                    inspectors.isPending
                      ? t('workflow.card.loadingShort')
                      : t('workflow.panel.selectInspector')
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {inspectorOptions.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.fullName || u.designation || t('workflow.panel.inspectorFallback', { id: u.id })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wf-insp-date">{t('workflow.panel.inspectionDate')}</Label>
            <Input
              id="wf-insp-date"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={disabled}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wf-insp-comment">{t('workflow.panel.comment')}</Label>
            <Textarea
              id="wf-insp-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              disabled={disabled}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">{t('workflow.panel.calendarInvite')}</p>
              <p className="text-muted-foreground text-xs">{t('workflow.panel.calendarInviteHint')}</p>
            </div>
            <Switch checked={notifyInspector} onCheckedChange={setNotifyInspector} disabled={disabled} />
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" disabled={disabled || busy} onClick={handleSubmit}>
          {execMut.isPending ? <Loader2 className="size-4 animate-spin" /> : skip ? <FastForward className="size-4" /> : <CalendarClock className="size-4" />}
          {skip ? t('workflow.actions.completeWithoutInspection') : t('workflow.actions.saveInspectionDate')}
        </Button>
        {step.transfer && (
          <Button type="button" variant="secondary" disabled={disabled || busy} onClick={() => transferMut.mutate()}>
            <Send className="size-4" /> {t('workflow.actions.transfer')}
          </Button>
        )}
      </div>
    </div>
  );
}
