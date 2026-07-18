'use client';

/**
 * Prosjekt-arbeidsbenk —— 单项目工作台壳。
 * 加载 GetProject 展示概览,Tabs 分区:
 *   Arbeidsflyt(ProjectWorkflow:To do/Done 可点 + 多工作流选择器)
 *   Sjekklister(GetAllProjectChecklists)
 *   Deltakere(GetAllProjectPartiesByProjectID)
 *   Dokumenter(占位)
 */
import * as React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MapPin } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProject } from '@/features/projects/api';
import { ProjectWorkflow } from '@/features/projects/workflow/project-workflow';
import { WorkflowSelector } from '@/features/projects/workflow/workflow-selector';
import { useWorkflowInstances } from '@/features/projects/workflow/use-workflow-instances';
import { ProjectChecklistsPanel } from '@/features/projects/checklists-panel';
import { ProjectPartiesPanel } from '@/features/projects/parties-panel';
import { ProjectDocsPanel } from '@/features/projects/project-docs-panel';
import { ProjectOverview } from '@/features/projects/project-overview';

import { ProjectActions } from './project-actions';

export default function ProjectWorkbenchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t } = useTranslation();
  const { id } = React.use(params);
  const projectId = Number(id);

  const { data: project, isLoading, isError } = useProject(projectId);

  // 工作流实例 + 选中(头部选择器 / Arbeidsflyt / Dokumenter 三处共用同一选中)。
  const { instances, selected, setSelectedId } = useWorkflowInstances(project);

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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">
              {project.title || t('projects.fallbackTitle', { id: projectId })}
            </h2>
            {project.projectStatus && <Badge variant="secondary">{project.projectStatus}</Badge>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* 工作流(服务)选择器 —— 常显(≥1 条即显示),驱动 Arbeidsflyt 与 Dokumenter。 */}
            <WorkflowSelector
              instances={instances}
              value={selected.instanceId}
              onChange={setSelectedId}
            />
            <ProjectActions project={project} />
          </div>
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <Tabs defaultValue="arbeidsflyt" className="min-w-0">
        <TabsList>
          <TabsTrigger value="arbeidsflyt">{t('projects.tabs.workflow')}</TabsTrigger>
          <TabsTrigger value="sjekklister">{t('projects.tabs.checklists')}</TabsTrigger>
          <TabsTrigger value="deltakere">{t('projects.tabs.parties')}</TabsTrigger>
          <TabsTrigger value="dokumenter">{t('projects.tabs.documents')}</TabsTrigger>
        </TabsList>

        <TabsContent value="arbeidsflyt">
          <ProjectWorkflow project={project} instance={selected} />
        </TabsContent>
        <TabsContent value="sjekklister">
          <ProjectChecklistsPanel projectId={projectId} />
        </TabsContent>
        <TabsContent value="deltakere">
          <ProjectPartiesPanel projectId={projectId} />
        </TabsContent>
        <TabsContent value="dokumenter">
          <ProjectDocsPanel projectId={projectId} workflowId={selected.workflowCategoryId} />
        </TabsContent>
        </Tabs>

        <ProjectOverview project={project} />
      </div>
    </div>
  );
}
