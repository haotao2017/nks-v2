'use client';

/**
 * PdfStepPanel —— WF13/14「Kontrollerklæring / Sluttrapport / Utført」:
 * 生成 PDF 报告 → 预览 + 编辑随附邮件 → multipart 发送。
 *
 * 预览 GetProjectWFThirteen/FourteenEmailFormated 返回 attachmentURL(PDF) + 邮件字段。
 * 用 iframe 内嵌预览 PDF。执行 ProjectWFThirteen/Fourteen 为 multipart:
 * request=JSON(含邮件字段 + attachmentURL),file 字段可选(默认不重传,后端按 attachmentURL 附件)。
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Send, Eye, Loader2 } from 'lucide-react';

import type { ProjectWorkflowDto } from '@nks/api-types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/features/email-templates/rich-text-editor';

import type { WorkflowStepDef } from './workflow-steps';
import { buildStepBase, useEmailPreview, useExecuteStepMultipart } from './workflow-api';
import { fetchUrlAsFile } from './fetch-attachment';

interface PdfStepPanelProps {
  projectId: number;
  step: WorkflowStepDef;
  disabled?: boolean;
  onCompleted?: () => void;
  /** Done 打开时：已完成步骤回填的最终邮件/附件（优先于模板预览）。 */
  completedData?: ProjectWorkflowDto | null;
}

function hasSentEmailContent(data?: ProjectWorkflowDto | null): boolean {
  if (!data) return false;
  return Boolean(
    data.emailContent ||
      data.emailSubject ||
      data.emailTo ||
      data.emailFrom ||
      data.attachmentURL ||
      (data.attachmentURLs?.length ?? 0) > 0 ||
      (data.emailHistoryId ?? 0) > 0,
  );
}

export function PdfStepPanel({
  projectId,
  step,
  disabled,
  onCompleted,
  completedData,
}: PdfStepPanelProps) {
  const { t } = useTranslation();
  const preview = useEmailPreview(step.preview);
  const execMut = useExecuteStepMultipart(projectId, step, step.execute, {
    successMessage: t('workflow.toast.reportSent'),
  });

  const [emailFrom, setEmailFrom] = React.useState('');
  const [emailTo, setEmailTo] = React.useState('');
  const [emailSubject, setEmailSubject] = React.useState('');
  const [emailContent, setEmailContent] = React.useState('');
  const [attachmentURL, setAttachmentURL] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);
  const [hydratedFromCompleted, setHydratedFromCompleted] = React.useState(
    hasSentEmailContent(completedData),
  );

  const previewMutate = preview.mutate;
  const apply = (pw?: ProjectWorkflowDto) => {
    setEmailFrom(pw?.emailFrom ?? '');
    setEmailTo(pw?.emailTo ?? '');
    setEmailSubject(pw?.emailSubject ?? '');
    setEmailContent(pw?.emailContent ?? '');
    setAttachmentURL(pw?.attachmentURL ?? '');
  };

  React.useEffect(() => {
    if (hasSentEmailContent(completedData)) {
      apply(completedData!);
      setHydratedFromCompleted(true);
      return;
    }
    if (completedData && completedData.isTransfer) {
      setHydratedFromCompleted(true);
      return;
    }
    previewMutate(buildStepBase(projectId, step, { isTransfer: false }), {
      onSuccess: (pw) => {
        apply(pw);
        setHydratedFromCompleted(false);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, step.key, completedData?.emailHistoryId, completedData?.emailContent, completedData?.isTransfer]);

  function handleSubmit() {
    void (async () => {
      const extra: Partial<ProjectWorkflowDto> = {
        isTransfer: false,
        emailFrom,
        emailTo,
        emailSubject,
        emailContent,
        attachmentURL,
      };
      let filesToSend = file ? [file] : [];
      // 对齐旧 admin:无用户替换文件时，仍把模板 PDF fetch 后作为 multipart 附件
      if (filesToSend.length === 0 && attachmentURL) {
        const template = await fetchUrlAsFile(attachmentURL, 'rapport.pdf');
        if (template) filesToSend = [template];
      }
      execMut.mutate(
        { extra, files: filesToSend.length ? filesToSend : undefined },
        { onSuccess: () => onCompleted?.() },
      );
    })();
  }

  if (preview.isPending && !hydratedFromCompleted) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
        <Loader2 className="size-4 animate-spin" /> {t('workflow.panel.reportLoading')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {attachmentURL ? (
        <div className="space-y-1.5">
          <Label>{t('workflow.panel.reportPdf')}</Label>
          <iframe title={t('workflow.panel.reportPdf')} src={attachmentURL} className="h-96 w-full rounded-md border" />
          <a
            href={attachmentURL}
            target="_blank"
            rel="noreferrer"
            className="text-primary inline-flex items-center gap-1.5 text-sm underline"
          >
            <FileText className="size-4" /> {t('workflow.panel.openPdfNewTab')}
          </a>
        </div>
      ) : (
        preview.isError && <p className="text-destructive text-sm">{t('workflow.panel.reportError')}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="wf-pdf-from">{t('workflow.panel.from')}</Label>
          <Input id="wf-pdf-from" value={emailFrom} onChange={(e) => setEmailFrom(e.target.value)} disabled={disabled} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wf-pdf-to">{t('workflow.panel.to')}</Label>
          <Input id="wf-pdf-to" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} disabled={disabled} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="wf-pdf-subject">{t('workflow.panel.subject')}</Label>
        <Input id="wf-pdf-subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} disabled={disabled} />
      </div>
      <div className="space-y-1.5">
        <Label>{t('workflow.panel.content')}</Label>
        <RichTextEditor value={emailContent} onChange={setEmailContent} disabled={disabled} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="wf-pdf-file">
          {t('workflow.panel.replaceAttachment')}{' '}
          <span className="text-muted-foreground font-normal">{t('workflow.panel.optional')}</span>
        </Label>
        <Input
          id="wf-pdf-file"
          type="file"
          disabled={disabled}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={disabled || preview.isPending}
          onClick={() => previewMutate(buildStepBase(projectId, step, { isTransfer: false }), { onSuccess: apply })}
        >
          <Eye className="size-4" /> {t('workflow.actions.regenerate')}
        </Button>
        <Button type="button" disabled={disabled || execMut.isPending} onClick={handleSubmit}>
          {execMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {t('workflow.actions.sendReport')}
        </Button>
      </div>
    </div>
  );
}
