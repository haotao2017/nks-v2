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

/** 工作流各步:标签 + 完成标志字段 + 对应时间戳字段(用于概览)。 */
const STEP_DEFS: { label: string; done: keyof ProjectDto; date?: keyof ProjectDto }[] = [
  { label: 'Takk for bestillingen', done: 'takkBestillingenIsCompleted', date: 'takkBestillingenCdate' },
  { label: 'Søknad om ansvarsrett', done: 'soknadOmAnsvarsrettIsCompleted', date: 'soknadOmAnsvarsrettCdate' },
  { label: 'Ansvarlig søker', done: 'ansvarligSokerIsCompleted', date: 'ansvarligSokerCdate' },
  { label: 'Gratulerer – godkjent', done: 'gratulererGodkjentIsCompleted', date: 'gratulererGodkjentCdate' },
  { label: 'Opprett sjekkliste', done: 'createChecklistIsCompleted', date: 'createChecklistCdate' },
  { label: 'Legg til parter', done: 'addPartiesIsCompleted', date: 'addPartiesCdate' },
  { label: 'Prosjektleder / kontakt kunde', done: 'setProLeaderContactCustomerIsCompleted', date: 'setProLeaderContactCustomerCdate' },
  { label: 'E-post kunde om inspeksjon', done: 'emailCustomerUpInspectionIsCompleted', date: 'emailCustomerUpInspectionCd' },
  { label: 'Parter data', done: 'partiesDataIsCompleted', date: 'partiesDataCdate' },
  { label: 'Tildel inspektør', done: 'assignInspectorIsCompleted', date: 'assignInspectorCdate' },
  { label: 'Godkjenn inspeksjonsrapport', done: 'isApprovedInspReportIsCompleted', date: 'reviewInspReportCd' },
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
            Tilbake til prosjekter
          </Link>
        </Button>
        <Card className="mx-auto max-w-xl">
          <CardHeader>
            <CardTitle>Fant ikke prosjektet</CardTitle>
            <CardDescription>Prosjekt #{id} kunne ikke lastes.</CardDescription>
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
            Tilbake til prosjekter
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            {project.title || `Prosjekt #${projectId}`}
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
          <TabsTrigger value="steg">Steg</TabsTrigger>
          <TabsTrigger value="sjekklister">Sjekklister</TabsTrigger>
          <TabsTrigger value="deltakere">Deltakere</TabsTrigger>
          <TabsTrigger value="dokumenter">Dokumenter</TabsTrigger>
          <TabsTrigger value="arbeidsflyt">Arbeidsflyt</TabsTrigger>
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
              <CardTitle>Dokumenter</CardTitle>
              <CardDescription>Dokumenthåndtering kommer — under utvikling.</CardDescription>
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
  const done = STEP_DEFS.filter((s) => project[s.done] === true).length;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Steg</CardTitle>
        <CardDescription>
          {done} av {STEP_DEFS.length} steg fullført.
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
                  {step.label}
                </span>
                <span className="ml-auto flex items-center gap-2">
                  {date && <span className="text-muted-foreground text-xs">{date}</span>}
                  <Badge variant={isDone ? 'default' : 'outline'}>
                    {isDone ? 'Done' : 'To do'}
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
  const { data = [], isLoading } = useProjectChecklists(projectId);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sjekklister</CardTitle>
        <CardDescription>Sjekklister knyttet til prosjektet.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : data.length === 0 ? (
          <p className="text-muted-foreground text-sm">Ingen sjekklister enda.</p>
        ) : (
          <ul className="divide-border divide-y">
            {data.map((c) => (
              <li key={c.id} className="py-2.5 text-sm">
                {c.checklistName || `Sjekkliste #${c.id}`}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function PartiesPanel({ projectId }: { projectId: number }) {
  const { data = [], isLoading } = useProjectParties(projectId);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deltakere</CardTitle>
        <CardDescription>Parter knyttet til prosjektet.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : data.length === 0 ? (
          <p className="text-muted-foreground text-sm">Ingen deltakere enda.</p>
        ) : (
          <ul className="divide-border divide-y">
            {data.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">{p.partyName || `Part #${p.id}`}</p>
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
