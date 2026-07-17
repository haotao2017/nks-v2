'use client';

/**
 * 项目文档管理面板 —— 对应原系统 projectWorkplace/ProjectDocsApp.js 的三个 Tab。
 *
 *  - Foretak:按参与方(useProjectParties)分组,每个参与方一张表,列出其各文档类型。
 *    每类可上传(带 partyId+partyTypeId+documenTypeId);已上传行显示文件链接 + 删除;
 *    未上传的必需类型标 required 徽标。参与方标题旁另有「通用上传」(仅带 partyId+partyTypeId)。
 *  - Generert:系统生成文档,按工作流步骤名分组,每个文件用 S3 直链(imageURL)下载。
 *  - Andre:通用附件上传(otherDocs:2)。
 *
 * workflowId 来源:面板仅收 projectId,文档按「工作流类别」组织。这里复用 useProject(projectId)
 *   (与父页共享缓存),从 projectServiceWorkflowList 解析工作流实例;多条时给出选择器,
 *   默认选中 workflowCategoryId===1 或第一条(对齐旧 ProjectWorkplaceHeader 的 Service 下拉)。
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileText, Loader2, Trash2, Upload } from 'lucide-react';

import type { ProjectDocumentDto, ProjectPartyDto } from '@nks/api-types';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useProject, useProjectParties } from './api';
import {
  useDeleteProjectDocument,
  useProjectPartyDocGroups,
  useSystemGeneratedDocs,
  useUploadProjectDocument,
  type PartyDocGroup,
  type UploadDocVars,
} from './doc-api';

/** 无 projectServiceWorkflowList 时的默认工作流类别(全部步骤),对齐旧 admin。 */
const DEFAULT_WORKFLOW_ID = 1;

interface WorkflowOption {
  /** 选择器唯一键(ServiceWorkflowCategory.id,回退 workflowCategoryId)。 */
  instanceId: number;
  /** 作为端点 workflowId 参数的工作流类别 ID。 */
  workflowCategoryId: number;
  label: string;
}

// ── 主面板 ──────────────────────────────────────────────────────────────

export function ProjectDocsPanel({ projectId }: { projectId: number }) {
  const { t } = useTranslation();

  const { data: project } = useProject(projectId);

  // 从 projectServiceWorkflowList 解析工作流实例(join projectService 取展示名)。
  const instances = React.useMemo<WorkflowOption[]>(() => {
    const swcList = project?.projectServiceWorkflowList ?? [];
    const services = project?.projectService ?? [];
    const mapped = swcList
      .filter((swc) => swc.workflowCategoryId != null)
      .map((swc) => {
        const svc = services.find((s) => s.serviceId === swc.serviceId)?.service;
        const label = svc?.name
          ? `${svc.name}${svc.description ? ` – ${svc.description}` : ''}`
          : t('docsPanel.workflow.fallback', { id: swc.workflowCategoryId });
        return {
          instanceId: swc.id ?? swc.workflowCategoryId!,
          workflowCategoryId: swc.workflowCategoryId!,
          label,
        } satisfies WorkflowOption;
      });
    if (mapped.length > 0) return mapped;
    return [
      {
        instanceId: DEFAULT_WORKFLOW_ID,
        workflowCategoryId: DEFAULT_WORKFLOW_ID,
        label: t('docsPanel.workflow.default'),
      },
    ];
  }, [project, t]);

  const defaultId =
    (instances.find((w) => w.workflowCategoryId === DEFAULT_WORKFLOW_ID) ?? instances[0])
      ?.instanceId ?? null;
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const activeId = selectedId ?? defaultId;
  const selected = instances.find((w) => w.instanceId === activeId) ?? instances[0];
  const workflowId = selected?.workflowCategoryId ?? DEFAULT_WORKFLOW_ID;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{t('docsPanel.title')}</CardTitle>
            <CardDescription>{t('docsPanel.description')}</CardDescription>
          </div>
          {instances.length > 1 && (
            <div className="flex items-center gap-2">
              <Label
                htmlFor="docs-wf-select"
                className="text-muted-foreground whitespace-nowrap text-xs"
              >
                {t('docsPanel.workflow.label')}
              </Label>
              <Select
                value={String(activeId ?? '')}
                onValueChange={(v) => setSelectedId(Number(v))}
              >
                <SelectTrigger id="docs-wf-select" className="w-[260px]">
                  <SelectValue placeholder={t('docsPanel.workflow.placeholder')} />
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
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="foretak">
          <TabsList>
            <TabsTrigger value="foretak">{t('docsPanel.tabs.foretak')}</TabsTrigger>
            <TabsTrigger value="generert">{t('docsPanel.tabs.generert')}</TabsTrigger>
            <TabsTrigger value="andre">{t('docsPanel.tabs.andre')}</TabsTrigger>
          </TabsList>

          <TabsContent value="foretak" className="mt-4">
            <ForetakTab projectId={projectId} workflowId={workflowId} />
          </TabsContent>
          <TabsContent value="generert" className="mt-4">
            <GenerertTab projectId={projectId} workflowId={workflowId} />
          </TabsContent>
          <TabsContent value="andre" className="mt-4">
            <AndreTab projectId={projectId} workflowId={workflowId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// ── 通用上传按钮(隐藏 file input) ──────────────────────────────────────

function UploadButton({
  onPick,
  pending,
  label,
  variant = 'outline',
  size = 'sm',
}: {
  onPick: (files: File[]) => void;
  pending: boolean;
  label: string;
  variant?: React.ComponentProps<typeof Button>['variant'];
  size?: React.ComponentProps<typeof Button>['size'];
}) {
  return (
    <Button asChild variant={variant} size={size} disabled={pending}>
      <label className="cursor-pointer">
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Upload className="size-4" aria-hidden />
        )}
        {label}
        <input
          type="file"
          multiple
          className="sr-only"
          disabled={pending}
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = '';
            if (files.length) onPick(files);
          }}
        />
      </label>
    </Button>
  );
}

// ── Foretak Tab ─────────────────────────────────────────────────────────

function ForetakTab({ projectId, workflowId }: { projectId: number; workflowId: number }) {
  const { t } = useTranslation();
  const { data: parties = [], isLoading: partiesLoading } = useProjectParties(projectId);
  const groups = useProjectPartyDocGroups(projectId, workflowId, parties);

  const uploadMutation = useUploadProjectDocument(projectId, workflowId);
  const deleteMutation = useDeleteProjectDocument(projectId, workflowId);
  const [deleteTarget, setDeleteTarget] = React.useState<ProjectDocumentDto | null>(null);

  if (partiesLoading) {
    return <Skeleton className="h-40 w-full" />;
  }
  if (parties.length === 0) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">
        {t('docsPanel.foretak.noParties')}
      </p>
    );
  }

  const confirmDelete = () => {
    if (!deleteTarget?.documentID) return;
    deleteMutation.mutate(deleteTarget.documentID, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <PartyDocSection
          key={group.party.partyTypeId ?? group.party.id}
          group={group}
          pending={uploadMutation.isPending || deleteMutation.isPending}
          onUpload={(vars) => uploadMutation.mutate(vars)}
          onDelete={setDeleteTarget}
        />
      ))}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('docsPanel.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('docsPanel.delete.confirmPrefix')}{' '}
              <span className="font-medium">
                {deleteTarget?.fileName || deleteTarget?.documentName}
              </span>
              {t('docsPanel.delete.confirmSuffix')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PartyDocSection({
  group,
  pending,
  onUpload,
  onDelete,
}: {
  group: PartyDocGroup;
  pending: boolean;
  onUpload: (vars: UploadDocVars) => void;
  onDelete: (doc: ProjectDocumentDto) => void;
}) {
  const { t } = useTranslation();
  const { party, docs, isLoading } = group;
  const partyId = party.partyId;
  const partyTypeId = party.partyTypeId;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold">
          {party.partyTypeName || t('docsPanel.foretak.unknownParty')}
          {party.partyName ? (
            <span className="text-muted-foreground ml-2 text-sm font-normal">
              {party.partyName}
            </span>
          ) : null}
        </h3>
        <UploadButton
          pending={pending}
          label={t('docsPanel.foretak.generalUpload')}
          onPick={(files) => onUpload({ files, partyId, partyTypeId })}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('docsPanel.foretak.columns.docType')}</TableHead>
              <TableHead>{t('docsPanel.foretak.columns.file')}</TableHead>
              <TableHead className="w-40 text-right">
                <span className="sr-only">{t('common.actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {Array.from({ length: 3 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : docs.length ? (
              docs.map((doc, index) => (
                <TableRow key={doc.documentID ?? `${doc.documenTypeId}-${index}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {doc.documentName || t('docsPanel.foretak.unnamedDocType')}
                      </span>
                      {doc.isRequired ? (
                        <Badge variant="destructive">{t('docsPanel.foretak.required')}</Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    {doc.imageURL ? (
                      <a
                        href={doc.imageURL}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary inline-flex items-center gap-1.5 hover:underline"
                      >
                        <FileText className="size-4" aria-hidden />
                        <span className="truncate">
                          {doc.fileName || t('docsPanel.foretak.uploadedFile')}
                        </span>
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        {t('docsPanel.foretak.notUploaded')}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <UploadButton
                        pending={pending}
                        label={t('docsPanel.foretak.upload')}
                        onPick={(files) =>
                          onUpload({
                            files,
                            partyId,
                            partyTypeId,
                            documenTypeId: doc.documenTypeId,
                          })
                        }
                      />
                      {doc.documentID ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          disabled={pending}
                          onClick={() => onDelete(doc)}
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">{t('common.delete')}</span>
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground h-20 text-center">
                  {t('docsPanel.foretak.noDocTypes')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

// ── Generert Tab ────────────────────────────────────────────────────────

function GenerertTab({ projectId, workflowId }: { projectId: number; workflowId: number }) {
  const { t } = useTranslation();
  const { data: docs = [], isLoading } = useSystemGeneratedDocs(projectId, workflowId);

  // 按工作流步骤名分组(保留后端顺序)。
  const groups = React.useMemo(() => {
    const map = new Map<string, ProjectDocumentDto[]>();
    for (const doc of docs) {
      const key = doc.workflowStepName || t('docsPanel.generert.unknownStep');
      const arr = map.get(key);
      if (arr) arr.push(doc);
      else map.set(key, [doc]);
    }
    return Array.from(map.entries());
  }, [docs, t]);

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }
  if (groups.length === 0) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">
        {t('docsPanel.generert.empty')}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map(([stepName, items]) => (
        <section key={stepName} className="space-y-3">
          <h3 className="text-base font-semibold">{stepName}</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('docsPanel.generert.columns.file')}</TableHead>
                  <TableHead className="w-32 text-right">
                    <span className="sr-only">{t('common.actions')}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((doc, index) => (
                  <TableRow key={doc.documentID ?? `${stepName}-${index}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="text-muted-foreground size-4" aria-hidden />
                        <span className="truncate">
                          {doc.fileName || t('docsPanel.generert.unnamedFile')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {doc.imageURL ? (
                        <Button asChild variant="outline" size="sm">
                          <a href={doc.imageURL} target="_blank" rel="noreferrer">
                            <Download className="size-4" aria-hidden />
                            {t('docsPanel.generert.download')}
                          </a>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          {t('docsPanel.generert.noFile')}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      ))}
    </div>
  );
}

// ── Andre Tab ───────────────────────────────────────────────────────────

function AndreTab({ projectId, workflowId }: { projectId: number; workflowId: number }) {
  const { t } = useTranslation();
  const uploadMutation = useUploadProjectDocument(projectId, workflowId);

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="text-muted-foreground text-sm">{t('docsPanel.andre.description')}</p>
      <UploadButton
        variant="default"
        pending={uploadMutation.isPending}
        label={t('docsPanel.andre.upload')}
        onPick={(files) => uploadMutation.mutate({ files, otherDocs: 2 })}
      />
    </div>
  );
}
