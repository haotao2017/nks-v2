'use client';

/**
 * 项目概览侧栏 —— 对应原系统 projectWorkplace/ProjectWorkplaceSidenav.js 的摘要卡。
 *
 * 展示:
 *  - 地址(address, postNo poststed, kommune)
 *  - 创建 / 最后修改日期(dated / modifiedDate)
 *  - Beskrivelse(描述):可内联编辑 —— 点「编辑」切出 textarea,保存调 useUpdateProject。
 *  - Husleverandør(建材供应商名,按 buildingSupplierId 从 useBuildingSuppliers 映射)
 *  - Kunde / Kontaktperson(按 customerId / contactPersonId 从 useContacts 映射)
 *  - Tjenester(服务列表,来自 project.projectService)
 *  - Foretak(参与方摘要,来自 useProjectParties)
 *
 * 说明:
 *  - 名字映射查不到时回退显示原始 id;完全缺失时显示占位 '—'。
 *  - 描述保存回传完整 project(`{ ...project, description }`),避免后端整单覆盖丢字段
 *    (参考向导 project-wizard.tsx 的 `{ ...(project ?? {}) }` 做法)。
 *  - useUpdateProject 内部已统一 toast(successMessage/errorMessage),此处不重复弹。
 *  - 不译接口数据 / 用户输入(地址、名字、描述等原样显示)。
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Pencil } from 'lucide-react';

import type { ProjectDto } from '@nks/api-types';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

import { useBuildingSuppliers } from '../building-suppliers/api';
import { useContacts } from '../contacts/api';
import { ProjectWizard } from './wizard/project-wizard';
import { ProjectPartiesPanel } from './parties-panel';
import { useProjectParties, useUpdateProject } from './api';

/** 挪威语短日期(容错:非法/缺失值回退 '—',对齐 columns.tsx)。 */
function formatDate(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('nb-NO', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

/** 拼接地址第二行:`postNo poststed`(任一缺失只显示存在的部分)。 */
function postLine(postNo?: string, poststed?: string): string {
  return [postNo, poststed].filter(Boolean).join(' ');
}

/** 小节标题 + 分隔线的通用包装。 */
function Section({
  label,
  action,
  children,
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between border-b pb-1">
        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {label}
        </span>
        {action}
      </div>
      {children}
    </div>
  );
}

export function ProjectOverview({ project }: { project: ProjectDto }) {
  const { t } = useTranslation();

  const { data: suppliers = [] } = useBuildingSuppliers();
  const { data: contacts = [] } = useContacts();
  const { data: parties = [] } = useProjectParties(project.id);
  const updateMutation = useUpdateProject();

  // ── 名字映射(id → 名称,查不到回退 id 字符串,完全缺失回退 '—')──────────
  const supplierName = React.useMemo(() => {
    if (project.buildingSupplierId == null) return '—';
    const hit = suppliers.find((s) => s.id === project.buildingSupplierId);
    return hit?.title || String(project.buildingSupplierId);
  }, [suppliers, project.buildingSupplierId]);

  // 客户联系人对象(用于补公司名/电话/邮箱,对齐旧 ContactCard)。
  const customer = React.useMemo(
    () => (project.customerId == null ? undefined : contacts.find((c) => c.id === project.customerId)),
    [contacts, project.customerId],
  );

  const customerName = React.useMemo(() => {
    if (project.customerId == null) return '—';
    return customer?.name || String(project.customerId);
  }, [customer, project.customerId]);

  const contactPersonName = React.useMemo(() => {
    if (project.contactPersonId == null) return '—';
    const hit = contacts.find((c) => c.id === project.contactPersonId);
    return hit?.name || String(project.contactPersonId);
  }, [contacts, project.contactPersonId]);

  const services = project.projectService ?? [];

  // ── 描述内联编辑 ────────────────────────────────────────────────────────
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(project.description ?? '');

  // ── Tjenester / Foretak 编辑弹窗 ────────────────────────────────────────
  const [editServicesOpen, setEditServicesOpen] = React.useState(false);
  const [editPartiesOpen, setEditPartiesOpen] = React.useState(false);

  const startEdit = () => {
    setDraft(project.description ?? '');
    setEditing(true);
  };
  const cancelEdit = () => setEditing(false);
  const saveDescription = () => {
    // 回传完整 project,仅覆盖 description,避免后端整单覆盖丢字段。
    updateMutation.mutate(
      { ...project, description: draft.trim() || undefined },
      { onSuccess: () => setEditing(false) },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('overviewPanel.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 地址 */}
        <div className="space-y-0.5">
          <p className="text-base font-medium">{project.address || '—'}</p>
          {postLine(project.postNo, project.poststed) ? (
            <p className="text-muted-foreground text-sm">
              {postLine(project.postNo, project.poststed)}
            </p>
          ) : null}
          {project.kommune ? (
            <p className="text-muted-foreground text-sm">{project.kommune}</p>
          ) : null}
        </div>

        {/* 创建 / 最后修改日期 */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('overviewPanel.created')}</span>
          <span>{formatDate(project.dated)}</span>
        </div>
        {project.modifiedDate ? (
          <div className="-mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('overviewPanel.modified')}</span>
            <span>{formatDate(project.modifiedDate)}</span>
          </div>
        ) : null}

        {/* Beskrivelse —— 内联编辑 */}
        <Section
          label={t('overviewPanel.description.label')}
          action={
            editing ? null : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 px-2"
                onClick={startEdit}
              >
                <Pencil className="size-3.5" />
                {t('common.edit')}
              </Button>
            )
          }
        >
          {editing ? (
            <div className="space-y-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t('overviewPanel.description.placeholder')}
                rows={4}
                autoFocus
                disabled={updateMutation.isPending}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={cancelEdit}
                  disabled={updateMutation.isPending}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={saveDescription}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                  {t('common.save')}
                </Button>
              </div>
            </div>
          ) : project.description ? (
            <p className="text-sm whitespace-pre-wrap">{project.description}</p>
          ) : (
            <p className="text-muted-foreground text-sm">
              {t('overviewPanel.description.empty')}
            </p>
          )}
        </Section>

        {/* Husleverandør */}
        <Section label={t('overviewPanel.buildingSupplier')}>
          <p className="text-sm">{supplierName}</p>
        </Section>

        {/* Kunde / Kontaktperson */}
        <Section label={t('overviewPanel.customer')}>
          <div className="space-y-0.5 text-sm">
            <p>{customerName}</p>
            {customer?.companyName ? (
              <p className="text-muted-foreground">{customer.companyName}</p>
            ) : null}
            {customer?.contactNo ? (
              <p>
                <a href={`tel:${customer.contactNo}`} className="text-muted-foreground hover:underline">
                  {customer.contactNo}
                </a>
              </p>
            ) : null}
            {customer?.email ? (
              <p>
                <a
                  href={`mailto:${customer.email}`}
                  className="text-muted-foreground hover:underline"
                >
                  {customer.email}
                </a>
              </p>
            ) : null}
            <p className="text-muted-foreground">
              {t('overviewPanel.contactPerson')}: {contactPersonName}
            </p>
          </div>
        </Section>

        {/* Tjenester —— Rediger 打开项目编辑向导(Service 步改服务) */}
        <Section
          label={t('overviewPanel.services.label')}
          action={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2"
              onClick={() => setEditServicesOpen(true)}
            >
              <Pencil className="size-3.5" />
              {t('common.edit')}
            </Button>
          }
        >
          {services.length ? (
            <ul className="space-y-1 text-sm">
              {services.map((s) => (
                <li key={s.id} className="flex items-baseline justify-between gap-3">
                  <span>
                    {s.service?.name || `#${s.serviceId ?? ''}`}
                    {s.service?.description ? (
                      <span className="text-muted-foreground"> ({s.service.description})</span>
                    ) : null}
                  </span>
                  {s.price ? (
                    <span className="text-muted-foreground shrink-0">{s.price}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">{t('overviewPanel.services.empty')}</p>
          )}
        </Section>

        {/* Foretak —— Rediger 打开参与方绑定面板 */}
        <Section
          label={t('overviewPanel.parties.label')}
          action={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2"
              onClick={() => setEditPartiesOpen(true)}
            >
              <Pencil className="size-3.5" />
              {t('common.edit')}
            </Button>
          }
        >
          {parties.length ? (
            <ul className="space-y-2 text-sm">
              {parties.map((p) => (
                <li key={p.id} className="space-y-0.5">
                  <p className="text-muted-foreground text-xs">{p.partyTypeName || '—'}</p>
                  <p>{p.partyName || '—'}</p>
                  {p.contactNumber ? (
                    <p className="text-muted-foreground text-xs">{p.contactNumber}</p>
                  ) : null}
                  {p.email ? (
                    <p className="text-muted-foreground text-xs">{p.email}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">{t('overviewPanel.parties.empty')}</p>
          )}
        </Section>
      </CardContent>

      {/* Tjenester 编辑 —— 复用项目编辑向导(编辑模式) */}
      <Dialog open={editServicesOpen} onOpenChange={setEditServicesOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('overviewPanel.services.editTitle')}</DialogTitle>
            <DialogDescription>{t('overviewPanel.services.editDescription')}</DialogDescription>
          </DialogHeader>
          {editServicesOpen && (
            <ProjectWizard
              project={project}
              onCancel={() => setEditServicesOpen(false)}
              onDone={() => setEditServicesOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Foretak 编辑 —— 复用参与方绑定面板 */}
      <Dialog open={editPartiesOpen} onOpenChange={setEditPartiesOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('overviewPanel.parties.editTitle')}</DialogTitle>
            <DialogDescription>{t('overviewPanel.parties.editDescription')}</DialogDescription>
          </DialogHeader>
          {editPartiesOpen && <ProjectPartiesPanel projectId={Number(project.id)} />}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
