'use client';

/**
 * ProjectWorkflow —— 项目工作流(Workflow 1)竖向 Stepper 入口。契约固定 { projectId }。
 *
 * 左侧:WORKFLOW_STEPS 的竖向步骤列表,按 GetProjectWorkflowCompletedTransferedSteps
 *      标记「已完成 / 已推进 / 当前」。右侧:所选步骤的通用面板(按 step.type 分派)。
 * 数据驱动:步骤配置见 workflow-steps.ts,hooks 见 workflow-api.ts,面板见 *-step-panel.tsx。
 */
import * as React from 'react';
import { Workflow, CheckCircle2, FastForward, Circle, Loader2, AlertCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { WORKFLOW_ID, WORKFLOW_STEPS, type WorkflowStepDef } from './workflow-steps';
import { useWorkflowProgress } from './workflow-api';
import { EmailStepPanel } from './email-step-panel';
import { UploadStepPanel } from './upload-step-panel';
import { DateInspectorStepPanel } from './date-inspector-step-panel';
import { InvoiceStepPanel } from './invoice-step-panel';
import { PdfStepPanel } from './pdf-step-panel';
import { SimpleStepPanel } from './simple-step-panel';

type StepStatus = 'done' | 'transferred' | 'current' | 'pending';

/** 按 type 分派到对应面板。 */
function StepPanel({ projectId, step }: { projectId: number; step: WorkflowStepDef }) {
  switch (step.type) {
    case 'email':
      return <EmailStepPanel projectId={projectId} step={step} />;
    case 'upload':
      return <UploadStepPanel projectId={projectId} step={step} />;
    case 'date-inspector':
      return <DateInspectorStepPanel projectId={projectId} step={step} />;
    case 'invoice':
      return <InvoiceStepPanel projectId={projectId} step={step} />;
    case 'pdf':
      return <PdfStepPanel projectId={projectId} step={step} />;
    case 'simple':
      return <SimpleStepPanel projectId={projectId} step={step} />;
    default:
      return null;
  }
}

function StatusIcon({ status }: { status: StepStatus }) {
  if (status === 'done') return <CheckCircle2 className="size-5 text-emerald-600" />;
  if (status === 'transferred') return <FastForward className="size-5 text-amber-600" />;
  if (status === 'current') return <Circle className="fill-primary text-primary size-5" />;
  return <Circle className="text-muted-foreground/40 size-5" />;
}

export function ProjectWorkflow({ projectId }: { projectId: number }) {
  const progress = useWorkflowProgress(projectId, WORKFLOW_ID);

  // stepId → isTransfer(存在即已处理)。
  const statusByStepId = React.useMemo(() => {
    const map = new Map<number, boolean>();
    for (const row of progress.data ?? []) {
      if (row.workflowStepId != null) map.set(row.workflowStepId, Boolean(row.isTransfer));
    }
    return map;
  }, [progress.data]);

  function statusOf(step: WorkflowStepDef): StepStatus {
    if (statusByStepId.has(step.workflowStepId)) {
      return statusByStepId.get(step.workflowStepId) ? 'transferred' : 'done';
    }
    return 'pending';
  }

  // 当前步骤 = 第一个未处理的步骤。
  const currentSeq = React.useMemo(() => {
    const firstPending = WORKFLOW_STEPS.find((s) => !statusByStepId.has(s.workflowStepId));
    return firstPending?.seq ?? WORKFLOW_STEPS[WORKFLOW_STEPS.length - 1].seq;
  }, [statusByStepId]);

  const [selectedSeq, setSelectedSeq] = React.useState<number | null>(null);
  const activeSeq = selectedSeq ?? currentSeq;
  const activeStep = WORKFLOW_STEPS.find((s) => s.seq === activeSeq) ?? WORKFLOW_STEPS[0];
  const activeStatus = statusOf(activeStep);

  const doneCount = WORKFLOW_STEPS.filter((s) => statusByStepId.has(s.workflowStepId)).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Workflow className="text-muted-foreground size-5" />
          Arbeidsflyt
        </CardTitle>
        <CardDescription>
          {progress.isPending
            ? 'Laster arbeidsflyt…'
            : `${doneCount} av ${WORKFLOW_STEPS.length} steg fullført for prosjekt #${projectId}.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {progress.isError && (
          <p className="text-destructive mb-4 flex items-center gap-2 text-sm">
            <AlertCircle className="size-4" /> Kunne ikke hente arbeidsflytstatus.
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(220px,280px)_1fr]">
          {/* 竖向 stepper */}
          <nav aria-label="Arbeidsflyt-steg" className="relative">
            {progress.isPending ? (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="size-4 animate-spin" /> Laster…
              </div>
            ) : (
              <ol className="space-y-1">
                {WORKFLOW_STEPS.map((step) => {
                  const raw = statusOf(step);
                  const status: StepStatus = raw === 'pending' && step.seq === currentSeq ? 'current' : raw;
                  const isActive = step.seq === activeSeq;
                  return (
                    <li key={step.key}>
                      <button
                        type="button"
                        onClick={() => setSelectedSeq(step.seq)}
                        aria-current={isActive ? 'step' : undefined}
                        className={cn(
                          'flex w-full items-start gap-3 rounded-md px-2 py-2 text-left transition-colors',
                          isActive ? 'bg-accent' : 'hover:bg-accent/50',
                        )}
                      >
                        <span className="mt-0.5 shrink-0">
                          <StatusIcon status={status} />
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 text-sm font-medium">
                            <span className="text-muted-foreground tabular-nums">{step.seq}.</span>
                            <span className="truncate">{step.title}</span>
                          </span>
                          {status === 'transferred' && (
                            <span className="text-muted-foreground text-xs">Overført</span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </nav>

          {/* 当前步骤面板 */}
          <div className="min-w-0">
            <div className="mb-4 flex items-center justify-between gap-2 border-b pb-3">
              <div>
                <h3 className="flex items-center gap-2 text-base font-semibold">
                  <span className="text-muted-foreground tabular-nums">{activeStep.seq}.</span>
                  {activeStep.title}
                </h3>
                {activeStep.description && (
                  <p className="text-muted-foreground mt-0.5 text-sm">{activeStep.description}</p>
                )}
              </div>
              {activeStatus === 'done' && <Badge className="bg-emerald-600">Fullført</Badge>}
              {activeStatus === 'transferred' && <Badge variant="secondary">Overført</Badge>}
            </div>

            {/* key 强制切步骤时重挂载,重置本地状态 + 重新预览。 */}
            <StepPanel key={activeStep.key} projectId={projectId} step={activeStep} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
