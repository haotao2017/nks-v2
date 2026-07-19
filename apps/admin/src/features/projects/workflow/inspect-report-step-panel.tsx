'use client';

/**
 * InspectReportStepPanel —— Gjennomgå rapport(旧 Wf1S12)。
 *
 * 功能:
 *  - Deviation / Checklists 两 Tab
 *  - 勾选偏差 → Send Selected(第三方邮件 InspThirParty)
 *  - Edit:改 status/comment;删已有图片
 *  - 无偏差时可 Approve(ProjectWFElevenDone + isApprovedInspReport)
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';

import type {
  EmailProjectPartiesWorkflowEntDto,
  ProjectChecklistItemsInspDataDto,
  ProjectWorkflowDto,
} from '@nks/api-types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/features/email-templates/rich-text-editor';
import { cn } from '@/lib/utils';

import {
  useDeleteChecklistItemImageInspData,
  useInspThirdPartyEmailPreview,
  useInspThirdPartySendEmail,
  useProjectChecklistsInspData,
  useUpdateChecklistItemInspData,
} from './insp-api';
import { buildStepBase, useExecuteStepJson } from './workflow-api';
import type { WorkflowStepDef } from './workflow-steps';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? '';

type InspItem = ProjectChecklistItemsInspDataDto & { checklistName?: string };

function statusClass(status?: string): string {
  if (status === 'OK') return 'text-green-600';
  if (status === 'Dev') return 'text-red-600';
  if (status === 'NA') return 'text-muted-foreground';
  return 'text-muted-foreground';
}

interface InspectReportStepPanelProps {
  projectId: number;
  step: WorkflowStepDef;
  disabled?: boolean;
}

export function InspectReportStepPanel({
  projectId,
  step,
  disabled,
}: InspectReportStepPanelProps) {
  const { t } = useTranslation();
  const inspQuery = useProjectChecklistsInspData(projectId);
  const approveMut = useExecuteStepJson(projectId, step, step.execute, {
    successMessage: t('workflow.toast.stepCompleted'),
  });

  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set());
  const [editItem, setEditItem] = React.useState<InspItem | null>(null);
  const [emailOpen, setEmailOpen] = React.useState(false);

  const checklists = inspQuery.data ?? [];
  const deviations = React.useMemo(() => {
    const list: InspItem[] = [];
    for (const cl of checklists) {
      for (const item of cl.projectChecklistItemsInspData ?? []) {
        if (item.status === 'Dev') {
          list.push({ ...item, checklistName: cl.checklistName });
        }
      }
    }
    return list;
  }, [checklists]);

  const allDevSelected =
    deviations.length > 0 && deviations.every((d) => d.id != null && selectedIds.has(d.id));

  function toggleAll(checked: boolean) {
    if (!checked) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(
      new Set(deviations.map((d) => d.id).filter((id): id is number => id != null)),
    );
  }

  function toggleOne(id: number, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function handleApprove() {
    approveMut.mutate({
      isTransfer: false,
      isApprovedInspReport: true,
    } as ProjectWorkflowDto);
  }

  if (inspQuery.isPending) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
        <Loader2 className="size-4 animate-spin" />
        {t('workflow.inspect.loading')}
      </div>
    );
  }

  if (inspQuery.isError) {
    return (
      <p className="text-destructive flex items-center gap-2 text-sm">
        <AlertCircle className="size-4" />
        {t('workflow.inspect.loadError')}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {step.descriptionKey && (
        <p className="text-muted-foreground text-sm">{t(step.descriptionKey)}</p>
      )}

      <Tabs defaultValue="deviations">
        <TabsList>
          <TabsTrigger value="deviations">
            {t('workflow.inspect.tabDeviations')}
            <Badge variant="secondary" className="ml-2">
              {deviations.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="checklists">{t('workflow.inspect.tabChecklists')}</TabsTrigger>
        </TabsList>

        <TabsContent value="deviations" className="mt-4 space-y-3">
          {deviations.length === 0 ? (
            <div className="space-y-4 rounded-lg border p-4">
              <p className="text-sm">{t('workflow.inspect.noDeviations')}</p>
              <Button
                type="button"
                disabled={disabled || approveMut.isPending}
                onClick={handleApprove}
              >
                {approveMut.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                {t('workflow.actions.approveAndComplete')}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={allDevSelected}
                    onCheckedChange={(v) => toggleAll(v === true)}
                    disabled={disabled}
                  />
                  {t('workflow.inspect.selectAll')}
                </label>
                <Button
                  type="button"
                  size="sm"
                  disabled={disabled || selectedIds.size === 0}
                  onClick={() => setEmailOpen(true)}
                >
                  <Mail className="size-4" />
                  {t('workflow.inspect.sendSelected')}
                </Button>
              </div>
              <ul className="divide-y rounded-lg border">
                {deviations.map((item) => (
                  <InspItemRow
                    key={item.id}
                    item={item}
                    selectable
                    selected={item.id != null && selectedIds.has(item.id)}
                    onToggle={(checked) => item.id != null && toggleOne(item.id, checked)}
                    onEdit={() => setEditItem(item)}
                    disabled={disabled}
                    showChecklistName
                  />
                ))}
              </ul>
            </>
          )}
        </TabsContent>

        <TabsContent value="checklists" className="mt-4 space-y-3">
          {checklists.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('workflow.inspect.noChecklists')}</p>
          ) : (
            checklists.map((cl) => (
              <details key={cl.id ?? cl.checklistName} className="rounded-lg border" open>
                <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
                  {cl.checklistName || t('workflow.inspect.unnamedChecklist')}
                </summary>
                <ul className="divide-y border-t">
                  {(cl.projectChecklistItemsInspData ?? []).map((item) => (
                    <InspItemRow
                      key={item.id}
                      item={{ ...item, checklistName: cl.checklistName }}
                      onEdit={() =>
                        setEditItem({ ...item, checklistName: cl.checklistName })
                      }
                      disabled={disabled}
                    />
                  ))}
                </ul>
              </details>
            ))
          )}
        </TabsContent>
      </Tabs>

      {editItem && (
        <EditInspItemDialog
          projectId={projectId}
          item={editItem}
          open
          onClose={() => setEditItem(null)}
          disabled={disabled}
        />
      )}

      {emailOpen && (
        <SendDeviationEmailDialog
          projectId={projectId}
          step={step}
          itemIds={[...selectedIds]}
          open={emailOpen}
          onClose={() => setEmailOpen(false)}
        />
      )}
    </div>
  );
}

function InspItemRow({
  item,
  selectable,
  selected,
  onToggle,
  onEdit,
  disabled,
  showChecklistName,
}: {
  item: InspItem;
  selectable?: boolean;
  selected?: boolean;
  onToggle?: (checked: boolean) => void;
  onEdit: () => void;
  disabled?: boolean;
  showChecklistName?: boolean;
}) {
  const { t } = useTranslation();
  const images = item.projectChecklistItemImageInspData ?? [];

  return (
    <li
      className={cn(
        'space-y-2 px-3 py-3',
        item.status === 'Dev' && 'bg-red-50 dark:bg-red-950/20',
      )}
    >
      {selectable && (
        <label className="flex items-center gap-2 text-xs">
          <Checkbox
            checked={!!selected}
            onCheckedChange={(v) => onToggle?.(v === true)}
            disabled={disabled}
          />
          {t('workflow.inspect.addToEmail')}
        </label>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium">{item.title || '—'}</p>
          {showChecklistName && item.checklistName ? (
            <p className="text-muted-foreground text-xs">{item.checklistName}</p>
          ) : null}
          <div className="flex flex-wrap gap-3 text-xs">
            <span className={statusClass(item.status)}>
              {t('workflow.inspect.status')}: {item.status || '—'}
            </span>
            <span>
              {t('workflow.inspect.comment')}: {item.comment || '—'}
            </span>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={disabled}
          onClick={onEdit}
        >
          <Pencil className="size-3.5" />
          {t('workflow.actions.edit')}
        </Button>
      </div>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img) =>
            img.imageURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={img.id ?? img.imageName}
                src={img.imageURL}
                alt={img.imageName || ''}
                className="h-16 w-16 rounded object-cover"
              />
            ) : null,
          )}
        </div>
      )}
    </li>
  );
}

function EditInspItemDialog({
  projectId,
  item,
  open,
  onClose,
  disabled,
}: {
  projectId: number;
  item: InspItem;
  open: boolean;
  onClose: () => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const updateMut = useUpdateChecklistItemInspData(projectId);
  const deleteImgMut = useDeleteChecklistItemImageInspData(projectId);
  const [status, setStatus] = React.useState(item.status ?? 'Dev');
  const [comment, setComment] = React.useState(item.comment ?? '');

  React.useEffect(() => {
    setStatus(item.status ?? 'Dev');
    setComment(item.comment ?? '');
  }, [item]);

  function handleSave() {
    if (item.id == null) return;
    updateMut.mutate(
      {
        id: item.id,
        checklistId: item.checklistId,
        status,
        comment,
      },
      { onSuccess: () => onClose() },
    );
  }

  const images = item.projectChecklistItemImageInspData ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item.title || t('workflow.inspect.editItem')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {item.checklistName ? (
            <p className="text-muted-foreground text-sm">{item.checklistName}</p>
          ) : null}
          <div className="space-y-2">
            <Label>{t('workflow.inspect.status')}</Label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: 'OK', label: t('workflow.inspect.statusOk') },
                  { value: 'Dev', label: t('workflow.inspect.statusDev') },
                  { value: 'NA', label: t('workflow.inspect.statusNa') },
                ] as const
              ).map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  size="sm"
                  variant={status === opt.value ? 'default' : 'outline'}
                  disabled={disabled}
                  onClick={() => setStatus(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="insp-comment">{t('workflow.inspect.comment')}</Label>
            <Textarea
              id="insp-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={disabled}
              rows={3}
            />
          </div>
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {images.map((img) => (
                <div key={img.id ?? img.imageName} className="relative">
                  {img.imageURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img.imageURL}
                      alt={img.imageName || ''}
                      className="h-20 w-20 rounded object-cover"
                    />
                  ) : null}
                  {img.id != null && (
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 size-6"
                        disabled={disabled || deleteImgMut.isPending}
                        onClick={() => deleteImgMut.mutate(img.id!)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            disabled={disabled || updateMut.isPending}
            onClick={handleSave}
          >
            {updateMut.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SendDeviationEmailDialog({
  projectId,
  step,
  itemIds,
  open,
  onClose,
}: {
  projectId: number;
  step: WorkflowStepDef;
  itemIds: number[];
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const previewMut = useInspThirdPartyEmailPreview();
  const sendMut = useInspThirdPartySendEmail(projectId);

  const [parties, setParties] = React.useState<EmailProjectPartiesWorkflowEntDto[]>([]);
  const [excluded, setExcluded] = React.useState<Set<number>>(new Set());
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [attachmentURL, setAttachmentURL] = React.useState('');
  const [fileName, setFileName] = React.useState('');
  const [edits, setEdits] = React.useState<
    Record<number, { to: string; subject: string; content: string }>
  >({});

  React.useEffect(() => {
    if (!open || itemIds.length === 0) return;
    previewMut.mutate(
      {
        projectId,
        workflowId: step.workflowId,
        workflowStepId: step.workflowStepId,
        itemIds,
      },
      {
        onSuccess: (pw) => {
          const list = pw?.emailProjectParties?.emailProjectPartiesWorkflowList ?? [];
          // 按 partyTypeID 去重(对齐旧 dialog)
          const byType = new Map<number, EmailProjectPartiesWorkflowEntDto>();
          for (const p of list) {
            if (p.partyTypeID != null && !byType.has(p.partyTypeID)) {
              byType.set(p.partyTypeID, p);
            }
          }
          const unique = [...byType.values()];
          setParties(unique);
          setExcluded(new Set());
          setActiveIdx(0);
          setAttachmentURL(pw?.attachmentURL ?? '');
          setFileName(pw?.fileName ?? '');
          const next: typeof edits = {};
          unique.forEach((p, i) => {
            next[i] = {
              to: p.emailTo ?? '',
              subject: p.title ?? '',
              content: p.content ?? '',
            };
          });
          setEdits(next);
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId, itemIds.join(',')]);

  const visibleIndices = parties
    .map((_, i) => i)
    .filter((i) => !excluded.has(i));

  async function handleSend() {
    if (visibleIndices.length === 0) return;
    const toSend = visibleIndices.map((i) => {
      const orig = parties[i];
      const e = edits[i];
      return {
        ...orig,
        emailTo: e?.to ?? orig.emailTo,
        title: e?.subject ?? orig.title,
        content: e?.content ?? orig.content,
        sendEmail: true,
      };
    });

    const body: ProjectWorkflowDto = {
      ...buildStepBase(projectId, step, { isTransfer: false }),
      fileName,
      emailContent: '',
      emailSubject: '',
      emailTo: '',
      emailFrom: '',
      baseURLSite: `${SITE_URL.replace(/\/+$/, '')}/external/update-deviation`,
      checklistItemIdCommaSeperated: itemIds.join(','),
      emailProjectParties: { emailProjectPartiesWorkflowList: toSend },
    };

    let pdfBlob: Blob;
    if (attachmentURL) {
      const res = await fetch(attachmentURL);
      pdfBlob = await res.blob();
    } else {
      pdfBlob = new Blob([], { type: 'application/pdf' });
    }

    sendMut.mutate(
      { body, pdfBlob, fileName: fileName || undefined },
      { onSuccess: () => onClose() },
    );
  }

  const active = visibleIndices.includes(activeIdx)
    ? activeIdx
    : (visibleIndices[0] ?? 0);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('workflow.inspect.sendSelected')}</DialogTitle>
        </DialogHeader>

        {previewMut.isPending ? (
          <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
            <Loader2 className="size-4 animate-spin" />
            {t('workflow.panel.emailPreviewLoading')}
          </div>
        ) : previewMut.isError ? (
          <p className="text-destructive text-sm">{t('workflow.panel.previewError')}</p>
        ) : (
          <div className="space-y-4">
            {excluded.size > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">{t('workflow.panel.addRecipient')}</span>
                {[...excluded].map((i) => (
                  <Button
                    key={i}
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setExcluded((prev) => {
                        const next = new Set(prev);
                        next.delete(i);
                        return next;
                      });
                      setActiveIdx(i);
                    }}
                  >
                    {parties[i]?.partyTypeName || t('workflow.panel.partFallback', { n: i + 1 })}
                  </Button>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-1 border-b pb-2">
              {visibleIndices.map((i) => (
                <button
                  key={i}
                  type="button"
                  className={cn(
                    'flex items-center gap-1 rounded-md px-2 py-1 text-xs',
                    active === i ? 'bg-primary text-primary-foreground' : 'bg-muted',
                  )}
                  onClick={() => setActiveIdx(i)}
                >
                  {parties[i]?.partyTypeName || t('workflow.panel.partFallback', { n: i + 1 })}
                  <X
                    className="size-3 opacity-70"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setExcluded((prev) => new Set(prev).add(i));
                    }}
                  />
                </button>
              ))}
            </div>

            {visibleIndices.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t('workflow.panel.noRecipients')}</p>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>{t('workflow.panel.to')}</Label>
                  <Input
                    value={edits[active]?.to ?? ''}
                    onChange={(e) =>
                      setEdits((prev) => ({
                        ...prev,
                        [active]: { ...prev[active], to: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('workflow.panel.subject')}</Label>
                  <Input
                    value={edits[active]?.subject ?? ''}
                    onChange={(e) =>
                      setEdits((prev) => ({
                        ...prev,
                        [active]: { ...prev[active], subject: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('workflow.panel.content')}</Label>
                  <RichTextEditor
                    value={edits[active]?.content ?? ''}
                    onChange={(html) =>
                      setEdits((prev) => ({
                        ...prev,
                        [active]: { ...prev[active], content: html },
                      }))
                    }
                  />
                </div>
                {attachmentURL ? (
                  <a
                    href={attachmentURL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary text-sm underline"
                  >
                    {t('workflow.panel.templateAttachment')}
                  </a>
                ) : null}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            disabled={
              sendMut.isPending ||
              previewMut.isPending ||
              visibleIndices.length === 0
            }
            onClick={() => void handleSend()}
          >
            {sendMut.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Mail className="size-4" />
            )}
            {t('workflow.actions.sendEmail')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
