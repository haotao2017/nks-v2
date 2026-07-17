'use client';

/**
 * InvoiceStepPanel —— WF15「Send faktura」:预览发票明细 + 触发 Tripletex 开票。
 *
 * 预览 ProjectWFFifteenGetDetails → projectInvoiceDataENT { invoiceDetails, amount }。
 * 执行 ProjectWFFifteen 触发发票。执行成功后展示后端返回的 message。
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Receipt, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { WorkflowStepDef } from './workflow-steps';
import { useExecuteStepJson, useInvoiceDetails } from './workflow-api';

interface InvoiceStepPanelProps {
  projectId: number;
  step: WorkflowStepDef;
  disabled?: boolean;
}

export function InvoiceStepPanel({ projectId, step, disabled }: InvoiceStepPanelProps) {
  const { t } = useTranslation();
  const details = useInvoiceDetails(projectId, step);
  const execMut = useExecuteStepJson(projectId, step, step.execute, {
    successMessage: t('workflow.toast.invoiceSent'),
  });

  const data = details.data;

  return (
    <div className="space-y-4">
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

      <Button type="button" disabled={disabled || execMut.isPending} onClick={() => execMut.mutate({})}>
        {execMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Receipt className="size-4" />}
        {t('workflow.actions.sendInvoice')}
      </Button>
    </div>
  );
}
