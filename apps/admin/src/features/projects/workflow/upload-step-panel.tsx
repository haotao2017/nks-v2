'use client';

/**
 * UploadStepPanel —— multipart 文件上传步骤(WF2 Ansvarsrett / WF3 IG)。
 *
 * - WF2:有邮件预览(GetProjectWFTwoEmailFormated 返回 emailFrom/Til/Emne/Innhold + attachmentURL 模板 PDF),
 *   可编辑邮件字段;上传单个 `file`(可选,不传则后端用模板)。
 * - WF3:无预览;上传多个 `files`。
 * 提交走 api-client.postForm(request=JSON.stringify({ProjectWorkflow}) + 文件)。
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Eye, FileText, Send, Loader2, X } from 'lucide-react';

import type { ProjectWorkflowDto } from '@nks/api-types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/features/email-templates/rich-text-editor';

import type { WorkflowStepDef } from './workflow-steps';
import { buildStepBase, useEmailPreview, useExecuteStepMultipart } from './workflow-api';

interface UploadStepPanelProps {
  projectId: number;
  step: WorkflowStepDef;
  disabled?: boolean;
}

export function UploadStepPanel({ projectId, step, disabled }: UploadStepPanelProps) {
  const { t } = useTranslation();
  const preview = useEmailPreview(step.preview);
  const execMut = useExecuteStepMultipart(projectId, step, step.execute);

  const [emailFrom, setEmailFrom] = React.useState('');
  const [emailTo, setEmailTo] = React.useState('');
  const [emailSubject, setEmailSubject] = React.useState('');
  const [emailContent, setEmailContent] = React.useState('');
  const [attachmentURL, setAttachmentURL] = React.useState('');
  const [files, setFiles] = React.useState<File[]>([]);

  const hasEmail = Boolean(step.preview);
  const previewMutate = preview.mutate;

  React.useEffect(() => {
    if (!step.preview) return;
    previewMutate(buildStepBase(projectId, step, { isTransfer: false }), {
      onSuccess: (pw?: ProjectWorkflowDto) => {
        setEmailFrom(pw?.emailFrom ?? '');
        setEmailTo(pw?.emailTo ?? '');
        setEmailSubject(pw?.emailSubject ?? '');
        setEmailContent(pw?.emailContent ?? '');
        setAttachmentURL(pw?.attachmentURL ?? '');
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, step.key]);

  function handleSubmit() {
    const extra: Partial<ProjectWorkflowDto> = hasEmail
      ? { isTransfer: false, emailFrom, emailTo, emailSubject, emailContent, attachmentURL }
      : { isTransfer: false };
    execMut.mutate({ extra, files });
  }

  return (
    <div className="space-y-4">
      {hasEmail && (
        <>
          {preview.isPending ? (
            <div className="text-muted-foreground flex items-center gap-2 py-4 text-sm">
              <Loader2 className="size-4 animate-spin" /> {t('workflow.panel.previewLoading')}
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="wf-up-from">{t('workflow.panel.from')}</Label>
                  <Input id="wf-up-from" value={emailFrom} onChange={(e) => setEmailFrom(e.target.value)} disabled={disabled} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="wf-up-to">{t('workflow.panel.to')}</Label>
                  <Input id="wf-up-to" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} disabled={disabled} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wf-up-subject">{t('workflow.panel.subject')}</Label>
                <Input id="wf-up-subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} disabled={disabled} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('workflow.panel.content')}</Label>
                <RichTextEditor value={emailContent} onChange={setEmailContent} disabled={disabled} />
              </div>
              {attachmentURL && (
                <a
                  href={attachmentURL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary inline-flex items-center gap-1.5 text-sm underline"
                >
                  <FileText className="size-4" /> {t('workflow.panel.templateAttachment')}
                </a>
              )}
            </>
          )}
        </>
      )}

      {/* Filopplasting */}
      <div className="space-y-1.5">
        <Label htmlFor="wf-up-files">
          {step.multiFile ? t('workflow.panel.uploadFilesLabel') : t('workflow.panel.uploadFileLabel')}
          {hasEmail && (
            <span className="text-muted-foreground font-normal"> {t('workflow.panel.optional')}</span>
          )}
        </Label>
        <Input
          id="wf-up-files"
          type="file"
          multiple={step.multiFile}
          disabled={disabled}
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />
        {files.length > 0 && (
          <ul className="mt-2 space-y-1">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="text-muted-foreground flex items-center gap-2 text-sm">
                <FileText className="size-3.5" />
                <span className="truncate">{f.name}</span>
                <button
                  type="button"
                  className="hover:text-destructive"
                  aria-label={t('workflow.panel.removeFile')}
                  onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {step.preview && (
          <Button
            type="button"
            variant="outline"
            disabled={disabled || preview.isPending}
            onClick={() =>
              previewMutate(buildStepBase(projectId, step, { isTransfer: false }), {
                onSuccess: (pw?: ProjectWorkflowDto) => {
                  setEmailFrom(pw?.emailFrom ?? '');
                  setEmailTo(pw?.emailTo ?? '');
                  setEmailSubject(pw?.emailSubject ?? '');
                  setEmailContent(pw?.emailContent ?? '');
                  setAttachmentURL(pw?.attachmentURL ?? '');
                },
              })
            }
          >
            <Eye className="size-4" /> {t('workflow.actions.updatePreview')}
          </Button>
        )}
        <Button type="button" disabled={disabled || execMut.isPending} onClick={handleSubmit}>
          {execMut.isPending ? <Loader2 className="size-4 animate-spin" /> : hasEmail ? <Send className="size-4" /> : <Upload className="size-4" />}
          {hasEmail ? t('workflow.actions.sendWithAttachment') : t('workflow.actions.uploadAndComplete')}
        </Button>
      </div>
    </div>
  );
}
