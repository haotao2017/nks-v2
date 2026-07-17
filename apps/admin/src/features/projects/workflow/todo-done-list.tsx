'use client';

/**
 * To-do / Done 步骤列表 —— 对齐旧 admin projectWorkplace/Steps.js 的可点交互。
 *
 *  - To-do 行:整行可点 → 打开该步操作面板;行尾 Overføre(推进/跳过,仅当步有 transfer 端点)。
 *  - Done 行:已完成(isTransfer=false)可点 → 只读面板 + Rediger 重开可编辑;
 *             已推进(isTransfer=true)显示「Overført」只读,不可点(对齐旧系统)。
 */
import { useTranslation } from 'react-i18next';
import { CheckCircle2, ChevronRight, Edit3, FastForward, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { WorkflowStepDef } from './workflow-steps';
import { useTransferStep } from './workflow-api';

export type StepStatus = 'todo' | 'done' | 'transferred';

export interface StepRow {
  step: WorkflowStepDef;
  status: StepStatus;
}

/** 打开某步面板的回调。mode='view' → 只读(disabled),mode='edit' → 可编辑。 */
export type OpenStep = (step: WorkflowStepDef, mode: 'view' | 'edit') => void;

function TodoRow({
  projectId,
  step,
  onOpen,
}: {
  projectId: number;
  step: WorkflowStepDef;
  onOpen: OpenStep;
}) {
  const { t } = useTranslation();
  const transferMut = useTransferStep(projectId, step, step.transfer);

  return (
    <li className="bg-card hover:bg-accent/40 flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 transition-colors">
      <button
        type="button"
        onClick={() => onOpen(step, 'edit')}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span className="text-muted-foreground tabular-nums text-sm">{step.seq}.</span>
        <span className="truncate text-sm font-medium">{t(step.titleKey)}</span>
        <ChevronRight className="text-muted-foreground ml-auto size-4 shrink-0" />
      </button>
      {step.transfer && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={transferMut.isPending}
          onClick={() => transferMut.mutate()}
        >
          {transferMut.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FastForward className="size-4" />
          )}
          {t('workflow.actions.transfer')}
        </Button>
      )}
    </li>
  );
}

function DoneRow({ step, status, onOpen }: { step: WorkflowStepDef; status: StepStatus; onOpen: OpenStep }) {
  const { t } = useTranslation();
  const isTransferred = status === 'transferred';

  return (
    <li className="bg-card flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5">
      {isTransferred ? (
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className="text-muted-foreground tabular-nums text-sm">{step.seq}.</span>
          <span className="text-muted-foreground truncate text-sm">{t(step.titleKey)}</span>
          <Badge variant="secondary" className="ml-2">
            {t('workflow.status.transferred')}
          </Badge>
        </span>
      ) : (
        <>
          <button
            type="button"
            onClick={() => onOpen(step, 'view')}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
          >
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            <span className="truncate text-sm font-medium">{t(step.titleKey)}</span>
          </button>
          <Button type="button" variant="ghost" size="sm" onClick={() => onOpen(step, 'edit')}>
            <Edit3 className="size-4" />
            {t('workflow.actions.edit')}
          </Button>
        </>
      )}
    </li>
  );
}

export function TodoList({
  projectId,
  rows,
  onOpen,
  emptyLabel,
}: {
  projectId: number;
  rows: StepRow[];
  onOpen: OpenStep;
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return <p className="text-muted-foreground py-6 text-center text-sm">{emptyLabel}</p>;
  }
  return (
    <ul className={cn('space-y-2')}>
      {rows.map((r) => (
        <TodoRow key={r.step.key} projectId={projectId} step={r.step} onOpen={onOpen} />
      ))}
    </ul>
  );
}

export function DoneList({
  rows,
  onOpen,
  emptyLabel,
}: {
  rows: StepRow[];
  onOpen: OpenStep;
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return <p className="text-muted-foreground py-6 text-center text-sm">{emptyLabel}</p>;
  }
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <DoneRow key={r.step.key} step={r.step} status={r.status} onOpen={onOpen} />
      ))}
    </ul>
  );
}
