'use client';

/**
 * InvoiceStepPanel —— WF15「Send faktura」:预览发票明细 + 触发 Tripletex 开票。
 *
 * 对齐旧 Wf1S13-send-faktura:上方展示 Contact(项目名 + 客户公司/电话/邮箱)、
 *   Address(address postNo poststed)、Service(每条服务名 + NOK 价格),
 *   数据取自项目详情(project + 按 customerId 命中联系人),非发票端点。
 * 下方仍保留 ProjectWFFifteenGetDetails → { invoiceDetails, amount } 预览 + 执行开票。
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Receipt, Loader2 } from 'lucide-react';

import type { ProjectDto } from '@nks/api-types';

import { Button } from '@/components/ui/button';
import { useContacts } from '../../contacts/api';

import type { WorkflowStepDef } from './workflow-steps';
import { useExecuteStepJson, useInvoiceDetails } from './workflow-api';

interface InvoiceStepPanelProps {
  projectId: number;
  project: ProjectDto;
  step: WorkflowStepDef;
  disabled?: boolean;
  onCompleted?: () => void;
}

export function InvoiceStepPanel({
  projectId,
  project,
  step,
  disabled,
  onCompleted,
}: InvoiceStepPanelProps) {
  const { t } = useTranslation();
  const details = useInvoiceDetails(projectId, step);
  const execMut = useExecuteStepJson(projectId, step, step.execute, {
    successMessage: t('workflow.toast.invoiceSent'),
  });

  const { data: contacts = [] } = useContacts();
  const customer = React.useMemo(
    () => (project.customerId == null ? undefined : contacts.find((c) => c.id === project.customerId)),
    [contacts, project.customerId],
  );
  const services = project.projectService ?? [];

  const data = details.data;

  return (
    <div className="space-y-4">
      {/* Contact / Address / Service —— 对齐旧 Wf1S13 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <p className="border-b pb-1 font-medium">{t('workflow.panel.invoiceContact')}</p>
          {project.title ? <p className="text-sm">{project.title}</p> : null}
          {customer?.companyName ? (
            <p className="text-muted-foreground text-sm">{customer.companyName}</p>
          ) : null}
          {customer?.contactNo ? (
            <a href={`tel:${customer.contactNo}`} className="text-muted-foreground block text-sm hover:underline">
              {customer.contactNo}
            </a>
          ) : null}
          {customer?.email ? (
            <a href={`mailto:${customer.email}`} className="text-muted-foreground block text-sm hover:underline">
              {customer.email}
            </a>
          ) : null}
        </div>
        <div className="space-y-1">
          <p className="border-b pb-1 font-medium">{t('workflow.panel.invoiceAddress')}</p>
          <p className="text-muted-foreground text-sm">
            {[project.address, project.postNo, project.poststed].filter(Boolean).join(' ') || '—'}
          </p>
        </div>
        <div className="space-y-1">
          <p className="border-b pb-1 font-medium">{t('workflow.panel.invoiceServiceHeader')}</p>
          {services.length === 0 ? (
            <p className="text-muted-foreground text-sm">—</p>
          ) : (
            services.map((item, i) => (
              <p key={item.id ?? i} className="text-muted-foreground text-sm">
                {item.service?.name ?? ''} {item.price != null ? `NOK ${item.price}` : ''}
              </p>
            ))
          )}
        </div>
      </div>

      {details.isPending ? (
        <div className="text-muted-foreground flex items-center gap-2 py-4 text-sm">
          <Loader2 className="size-4 animate-spin" /> {t('workflow.panel.invoiceLoading')}
        </div>
      ) : details.isError ? (
        <p className="text-destructive text-sm">{t('workflow.panel.invoiceError')}</p>
      ) : (
        <dl className="divide-y rounded-md border text-sm">
          <div className="flex justify-between p-3">
            <dt className="text-muted-foreground">{t('workflow.panel.invoiceDetails')}</dt>
            <dd className="text-right font-medium">{data?.invoiceDetails || '—'}</dd>
          </div>
          <div className="flex justify-between p-3">
            <dt className="text-muted-foreground">{t('workflow.panel.invoiceAmount')}</dt>
            <dd className="text-right font-medium">
              {data?.amount != null ? `${data.amount} kr` : '—'}
            </dd>
          </div>
        </dl>
      )}

      <Button
        type="button"
        disabled={disabled || execMut.isPending}
        onClick={() => execMut.mutate({}, { onSuccess: () => onCompleted?.() })}
      >
        {execMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Receipt className="size-4" />}
        {t('workflow.actions.sendInvoice')}
      </Button>
    </div>
  );
}
