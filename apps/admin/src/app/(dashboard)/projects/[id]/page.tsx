'use client';

/**
 * Prosjekt-arbeidsbenk —— 单项目工作台壳。
 * 加载 GetProject 展示概览,Tabs 分区:
 *   Steg(按 *IsCompleted 时间戳渲染 To do/Done 概览)
 *   Sjekklister(GetAllProjectChecklists)
 *   Deltakere(GetAllProjectPartiesByProjectID)
 *   Dokumenter(占位)
 *   Arbeidsflyt(ProjectWorkflow 占位组件)
 */
import * as React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, Circle, MapPin } from 'lucide-react';

import type { ProjectDto } from '@nks/api-types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useProject,
  useProjectChecklists,
  useProjectParties,
} from '@/features/projects/api';
import { ProjectWorkflow } from '@/features/projects/workflow/project-workflow';

/** 工作流各步:i18n 标签 key + 完成标志字段 + 对应时间戳字段(用于概览)。 */
const STEP_DEFS: { labelKey: string; done: keyof ProjectDto; date?: keyof ProjectDto }[] = [
  { labelKey: 'projects.steps.defs.takkBestillingen', done: 'takkBestillingenIsCompleted', date: 'takkBestillingenCdate' },
  { labelKey: 'projects.steps.defs.soknadOmAnsvarsrett', done: 'soknadOmAnsvarsrettIsCompleted', date: 'soknadOmAnsvarsrettCdate' },
  { labelKey: 'projects.steps.defs.ansvarligSoker', done: 'ansvarligSokerIsCompleted', date: 'ansvarligSokerCdate' },
  { labelKey: 'projects.steps.defs.gratulererGodkjent', done: 'gratulererGodkjentIsCompleted', date: 'gratulererGodkjentCdate' },
  { labelKey: 'projects.steps.defs.createChecklist', done: 'createChecklistIsCompleted', date: 'createChecklistCdate' },
  { labelKey: 'projects.steps.defs.addParties', done: 'addPartiesIsCompleted', date: 'addPartiesCdate' },
  { labelKey: 'projects.steps.defs.setProLeaderContactCustomer', done: 'setProLeaderContactCustomerIsCompleted', date: 'setProLeaderContactCustomerCdate' },
  { labelKey: 'projects.steps.defs.emailCustomerUpInspection', done: 'emailCustomerUpInspectionIsCompleted', date: 'emailCustomerUpInspectionCd' },
  { labelKey: 'projects.steps.defs.partiesData', done: 'partiesDataIsCompleted', date: 'partiesDataCdate' },
  { labelKey: 'projects.steps.defs.assignInspector', done: 'assignInspectorIsCompleted', date: 'assignInspectorCdate' },
  { labelKey: 'projects.steps.defs.approveInspReport', done: 'isApprovedInspReportIsCompleted', date: 'reviewInspReportCd' },
];

function formatDate(value?: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('nb-NO', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function ProjectWorkbenchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t } = useTranslation();
  const { id } = React.use(params);
  const projectId = Number(id);

  const { data: project, isLoading, isError } = useProject(projectId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/projects">
            <ArrowLeft className="size-4" />
            {t('projects.backToProjects')}
          </Link>
        </Button>
        <Card className="mx-auto max-w-xl">
          <CardHeader>
            <CardTitle>{t('projects.notFound')}</CardTitle>
            <CardDescription>{t('projects.notFoundDescription', { id })}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/projects">
            <ArrowLeft className="size-4" />
            {t('projects.backToProjects')}
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            {project.title || t('projects.fallbackTitle', { id: projectId })}
          </h2>
          {project.projectStatus && <Badge variant="secondary">{project.projectStatus}</Badge>}
        </div>
        {project.address && (
          <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <MapPin className="size-4" />
            {[project.address, project.postNo, project.poststed, project.kommune]
              .filter(Boolean)
              .join(', ')}
          </p>
        )}
      </div>

      <Tabs defaultValue="steg">
        <TabsList>
          <TabsTrigger value="steg">{t('projects.tabs.steps')}</TabsTrigger>
          <TabsTrigger value="sjekklister">{t('projects.tabs.checklists')}</TabsTrigger>
          <TabsTrigger value="deltakere">{t('projects.tabs.parties')}</TabsTrigger>
          <TabsTrigger value="dokumenter">{t('projects.tabs.documents')}</TabsTrigger>
          <TabsTrigger value="arbeidsflyt">{t('projects.tabs.workflow')}</TabsTrigger>
        </TabsList>

        <TabsContent value="steg">
          <StegOverview project={project} />
        </TabsContent>
        <TabsContent value="sjekklister">
          <ChecklistsPanel projectId={projectId} />
        </TabsContent>
        <TabsContent value="deltakere">
          <PartiesPanel projectId={projectId} />
        </TabsContent>
        <TabsContent value="dokumenter">
          <Card>
            <CardHeader>
              <CardTitle>{t('projects.documents.title')}</CardTitle>
              <CardDescription>{t('projects.documents.comingSoon')}</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
        <TabsContent value="arbeidsflyt">
          <ProjectWorkflow projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StegOverview({ project }: { project: ProjectDto }) {
  const { t } = useTranslation();
  const done = STEP_DEFS.filter((s) => project[s.done] === true).length;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('projects.steps.title')}</CardTitle>
        <CardDescription>
          {t('projects.steps.progress', { done, total: STEP_DEFS.length })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="divide-border divide-y">
          {STEP_DEFS.map((step) => {
            const isDone = project[step.done] === true;
            const date = step.date ? formatDate(project[step.date] as string | undefined) : '';
            return (
              <li key={String(step.done)} className="flex items-center gap-3 py-2.5">
                {isDone ? (
                  <Check className="text-primary size-4 shrink-0" />
                ) : (
                  <Circle className="text-muted-foreground size-4 shrink-0" />
                )}
                <span className={isDone ? 'text-foreground text-sm' : 'text-muted-foreground text-sm'}>
                  {t(step.labelKey)}
                </span>
                <span className="ml-auto flex items-center gap-2">
                  {date && <span className="text-muted-foreground text-xs">{date}</span>}
                  <Badge variant={isDone ? 'default' : 'outline'}>
                    {isDone ? t('projects.steps.done') : t('projects.steps.todo')}
                  </Badge>
                </span>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

function ChecklistsPanel({ projectId }: { projectId: number }) {
  const { t } = useTranslation();
  const { data = [], isLoading } = useProjectChecklists(projectId);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('projects.checklists.title')}</CardTitle>
        <CardDescription>{t('projects.checklists.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : data.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('projects.checklists.empty')}</p>
        ) : (
          <ul className="divide-border divide-y">
            {data.map((c) => (
              <li key={c.id} className="py-2.5 text-sm">
                {c.checklistName || t('projects.checklists.fallbackName', { id: c.id })}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function PartiesPanel({ projectId }: { projectId: number }) {
  const { t } = useTranslation();
  const { data = [], isLoading } = useProjectParties(projectId);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('projects.parties.title')}</CardTitle>
        <CardDescription>{t('projects.parties.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : data.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('projects.parties.empty')}</p>
        ) : (
          <ul className="divide-border divide-y">
            {data.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">{p.partyName || t('projects.parties.fallbackName', { id: p.id })}</p>
                  {p.email && <p className="text-muted-foreground text-xs">{p.email}</p>}
                </div>
                {p.partyTypeName && <Badge variant="secondary">{p.partyTypeName}</Badge>}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
