'use client';

/**
 * ProjectWorkflow —— 项目工作台(对齐旧 admin projectWorkplace)。
 *
 * 结构:
 *  - 工作流实例由详情页头部的 useWorkflowInstances 统一持有并选中,这里通过 `instance` prop
 *    接收当前选中实例(不再自管选择器);头部选择器切换即联动本面板与 Dokumenter。
 *  - 选中实例的 workflowCategoryId 作为 GetProjectWorkflowCompletedTransferedSteps 的 WorkflowID
 *    与各步请求体的 workflowId(去掉旧的写死 WORKFLOW_ID=1)。
 *  - 按选中服务的 description 过滤要显示的步骤(Kontroll / Innhenting av dokumentasjon)。
 *  - To do / Done 两个子 Tab:
 *      · To-do 行可点 → 打开该步操作面板(可编辑);行尾 Overføre 推进/跳过。
 *      · Done 行可点 → 只读面板(disabled);已推进项显示「Overført」。
 *
 * Done/To-do 划分:GetProjectWorkflowCompletedTransferedSteps 返回已处理步骤,
 *   isTransfer=false → 已完成(Done,可点只读),isTransfer=true → 已推进(Done 内只读标记),
 *   其余 → To-do。
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Workflow, AlertCircle, Loader2 } from 'lucide-react';

import type { ProjectDto } from '@nks/api-types';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  WORKFLOW_ID,
  WORKFLOW_STEPS,
  filterStepsByService,
  type WorkflowStepDef,
} from './workflow-steps';
import { useWorkflowProgress } from './workflow-api';
import type { WorkflowInstance } from './workflow-selector';
import { TodoList, DoneList, type StepRow, type OpenStep } from './todo-done-list';
import { EmailStepPanel } from './email-step-panel';
import { UploadStepPanel } from './upload-step-panel';
import { DateInspectorStepPanel } from './date-inspector-step-panel';
import { InvoiceStepPanel } from './invoice-step-panel';
import { PdfStepPanel } from './pdf-step-panel';
import { SimpleStepPanel } from './simple-step-panel';

/** 按 type 分派到对应面板。disabled=true 为只读(Done 项)。 */
function StepPanel({
  projectId,
  step,
  disabled,
}: {
  projectId: number;
  step: WorkflowStepDef;
  disabled?: boolean;
}) {
  switch (step.type) {
    case 'email':
      return <EmailStepPanel projectId={projectId} step={step} disabled={disabled} />;
    case 'upload':
      return <UploadStepPanel projectId={projectId} step={step} disabled={disabled} />;
    case 'date-inspector':
      return <DateInspectorStepPanel projectId={projectId} step={step} disabled={disabled} />;
    case 'invoice':
      return <InvoiceStepPanel projectId={projectId} step={step} disabled={disabled} />;
    case 'pdf':
      return <PdfStepPanel projectId={projectId} step={step} disabled={disabled} />;
    case 'simple':
      return <SimpleStepPanel projectId={projectId} step={step} disabled={disabled} />;
    default:
      return null;
  }
}

export function ProjectWorkflow({
  project,
  instance,
}: {
  project: ProjectDto;
  /** 当前选中工作流实例(由详情页头部 useWorkflowInstances 选中并下传)。 */
  instance: WorkflowInstance;
}) {
  const { t } = useTranslation();
  const projectId = Number(project.id);

  const workflowCategoryId = instance.workflowCategoryId ?? WORKFLOW_ID;

  const progress = useWorkflowProgress(projectId, workflowCategoryId);

  // stepId → isTransfer(存在即已处理)。
  const statusByStepId = React.useMemo(() => {
    const map = new Map<number, boolean>();
    for (const row of progress.data ?? []) {
      if (row.workflowStepId != null) map.set(row.workflowStepId, Boolean(row.isTransfer));
    }
    return map;
  }, [progress.data]);

  // 按服务过滤步骤,并把每步 workflowId 覆盖为选中实例的 workflowCategoryId
  // (buildStepBase / 各 mutation 的 invalidateKeys 都读 step.workflowId)。
  const visibleSteps = React.useMemo(
    () =>
      filterStepsByService(WORKFLOW_STEPS, instance.serviceDescription).map((s) => ({
        ...s,
        workflowId: workflowCategoryId,
      })),
    [instance.serviceDescription, workflowCategoryId],
  );

  const { todoRows, doneRows } = React.useMemo(() => {
    const todo: StepRow[] = [];
    const done: StepRow[] = [];
    for (const step of visibleSteps) {
      if (!statusByStepId.has(step.workflowStepId)) {
        todo.push({ step, status: 'todo' });
      } else {
        done.push({ step, status: statusByStepId.get(step.workflowStepId) ? 'transferred' : 'done' });
      }
    }
    return { todoRows: todo, doneRows: done };
  }, [visibleSteps, statusByStepId]);

  // 面板对话框状态。
  const [dialog, setDialog] = React.useState<{ step: WorkflowStepDef; mode: 'view' | 'edit' } | null>(
    null,
  );
  const openStep: OpenStep = (step, mode) => setDialog({ step, mode });
  const closeDialog = () => setDialog(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Workflow className="text-muted-foreground size-5" />
          {t('workflow.card.title')}
        </CardTitle>
        <CardDescription className="mt-1">
          {progress.isPending
            ? t('workflow.card.loading')
            : t('workflow.card.progress', {
                done: doneRows.length,
                total: visibleSteps.length,
                projectId,
              })}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {progress.isError && (
          <p className="text-destructive mb-4 flex items-center gap-2 text-sm">
            <AlertCircle className="size-4" /> {t('workflow.card.loadError')}
          </p>
        )}

        {progress.isPending ? (
          <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
            <Loader2 className="size-4 animate-spin" /> {t('workflow.card.loadingShort')}
          </div>
        ) : (
          <Tabs defaultValue="todo">
            <TabsList>
              <TabsTrigger value="todo">
                {t('workflow.tabs.todo')}
                <Badge variant="secondary" className="ml-2">
                  {todoRows.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="done">
                {t('workflow.tabs.done')}
                <Badge variant="secondary" className="ml-2">
                  {doneRows.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="todo" className="mt-4">
              <TodoList
                projectId={projectId}
                rows={todoRows}
                onOpen={openStep}
                emptyLabel={t('workflow.tabs.todoEmpty')}
              />
            </TabsContent>
            <TabsContent value="done" className="mt-4">
              <DoneList
                rows={doneRows}
                onOpen={openStep}
                emptyLabel={t('workflow.tabs.doneEmpty')}
              />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>

      <Dialog open={dialog !== null} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          {dialog && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-muted-foreground tabular-nums">{dialog.step.seq}.</span>
                  {t(dialog.step.titleKey)}
                  {dialog.mode === 'view' && (
                    <Badge className="bg-emerald-600">{t('workflow.status.done')}</Badge>
                  )}
                </DialogTitle>
                {dialog.step.descriptionKey && (
                  <DialogDescription>{t(dialog.step.descriptionKey)}</DialogDescription>
                )}
              </DialogHeader>
              {/* key 强制切步骤/模式时重挂载,重置本地状态 + 重新预览。 */}
              <StepPanel
                key={`${dialog.step.key}-${dialog.mode}`}
                projectId={projectId}
                step={dialog.step}
                disabled={dialog.mode === 'view'}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
