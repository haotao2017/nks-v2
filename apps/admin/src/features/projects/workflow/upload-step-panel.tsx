'use client';

/**
 * UploadStepPanel —— multipart 文件上传步骤(WF2 Ansvarsrett / WF3 IG)。
 *
 * - WF2:有邮件预览(GetProjectWFTwoEmailFormated 返回 emailFrom/Til/Emne/Innhold + attachmentURL 模板 PDF),
 *   可编辑邮件字段;上传单个 `file`(可选,不传则后端用模板)。
 * - WF3:无邮件;上传多个 `files`;Done 打开时用 GetProjectWFThree / completedData.attachmentURLs 回看。
 * 提交走 api-client.postForm(request=JSON.stringify({ProjectWorkflow}) + 文件)。
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Eye, FileText, Send, Loader2, X, ExternalLink } from 'lucide-react';

import type { ProjectWorkflowDto } from '@nks/api-types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/features/email-templates/rich-text-editor';

import type { WorkflowStepDef } from './workflow-steps';
import { buildStepBase, useEmailPreview, useExecuteStepMultipart } from './workflow-api';
import { fetchUrlAsFile } from './fetch-attachment';
import { toast } from 'sonner';

interface UploadStepPanelProps {
  projectId: number;
  step: WorkflowStepDef;
  disabled?: boolean;
  onCompleted?: () => void;
  /** Done 打开时：已完成步骤回填的最终邮件/附件。 */
  completedData?: ProjectWorkflowDto | null;
}

function collectAttachmentUrls(data?: ProjectWorkflowDto | null): string[] {
  if (!data) return [];
  const fromList = [
    ...(data.attachmentURLs ?? []),
    ...(data.fileUrls ?? []),
  ].filter((u): u is string => Boolean(u));
  if (fromList.length > 0) return Array.from(new Set(fromList));
  if (data.attachmentURL) return [data.attachmentURL];
  return [];
}

function hasCompletedPayload(data?: ProjectWorkflowDto | null): boolean {
  if (!data) return false;
  if (collectAttachmentUrls(data).length > 0) return true;
  return Boolean(
    data.emailContent ||
      data.emailSubject ||
      data.emailTo ||
      data.emailFrom ||
      data.cc ||
      (data.emailHistoryId ?? 0) > 0,
  );
}

function isImageUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(path);
  } catch {
    return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(url);
  }
}

function fileLabel(url: string, index: number, names?: string[]): string {
  const fromName = names?.[index];
  if (fromName) return fromName;
  try {
    const path = new URL(url).pathname;
    const base = path.split('/').pop();
    if (base) return decodeURIComponent(base);
  } catch {
    /* ignore */
  }
  return `File ${index + 1}`;
}

export function UploadStepPanel({
  projectId,
  step,
  disabled,
  onCompleted,
  completedData,
}: UploadStepPanelProps) {
  const { t } = useTranslation();
  const preview = useEmailPreview(step.preview);
  const execMut = useExecuteStepMultipart(projectId, step, step.execute);

  const [emailFrom, setEmailFrom] = React.useState('');
  const [emailTo, setEmailTo] = React.useState('');
  const [cc, setCc] = React.useState('');
  const [emailSubject, setEmailSubject] = React.useState('');
  const [emailContent, setEmailContent] = React.useState('');
  const [attachmentURL, setAttachmentURL] = React.useState('');
  const [attachmentURLs, setAttachmentURLs] = React.useState<string[]>([]);
  const [fileNames, setFileNames] = React.useState<string[]>([]);
  const [files, setFiles] = React.useState<File[]>([]);
  const [hydratedFromCompleted, setHydratedFromCompleted] = React.useState(
    hasCompletedPayload(completedData),
  );

  const hasEmail = Boolean(step.preview) && step.key !== 'igangsettingstillatelse';
  const isIgUpload = step.key === 'igangsettingstillatelse' || Boolean(step.multiFile && !hasEmail);
  const previewMutate = preview.mutate;

  const applyPayload = (pw?: ProjectWorkflowDto) => {
    setEmailFrom(pw?.emailFrom ?? '');
    setEmailTo(pw?.emailTo ?? '');
    setCc(pw?.cc ?? '');
    setEmailSubject(pw?.emailSubject ?? '');
    setEmailContent(pw?.emailContent ?? '');
    const urls = collectAttachmentUrls(pw);
    setAttachmentURLs(urls);
    setAttachmentURL(pw?.attachmentURL ?? urls[0] ?? '');
    setFileNames(pw?.fileNames ?? []);
  };

  React.useEffect(() => {
    if (hasCompletedPayload(completedData)) {
      applyPayload(completedData!);
      setHydratedFromCompleted(true);
      return;
    }
    if (completedData && completedData.isTransfer) {
      setHydratedFromCompleted(true);
      return;
    }
    if (!step.preview) return;
    previewMutate(buildStepBase(projectId, step, { isTransfer: false }), {
      onSuccess: (pw?: ProjectWorkflowDto) => {
        applyPayload(pw);
        setHydratedFromCompleted(Boolean(collectAttachmentUrls(pw).length > 0 || pw?.emailContent));
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    projectId,
    step.key,
    completedData?.emailHistoryId,
    completedData?.emailContent,
    completedData?.isTransfer,
    completedData?.attachmentURL,
    completedData?.attachmentURLs?.join('|'),
  ]);

  function handleSubmit() {
    void (async () => {
      // IG (wf3): 无文件不允许完成（对齐旧 Wf1S3）
      if (isIgUpload && files.length === 0) {
        toast.error(t('workflow.panel.uploadRequired'));
        return;
      }
      const extra: Partial<ProjectWorkflowDto> = hasEmail
        ? { isTransfer: false, emailFrom, emailTo, cc: cc.trim() || undefined, emailSubject, emailContent, attachmentURL }
        : { isTransfer: false };
      let filesToSend = [...files];
      // Ansvarsrett: 无用户附件时仍拉取模板 PDF（对齐旧 Wf1S2）
      if (hasEmail && filesToSend.length === 0 && attachmentURL) {
        const template = await fetchUrlAsFile(attachmentURL, 'ansvarsrett.pdf');
        if (template) filesToSend = [template];
      }
      execMut.mutate(
        { extra, files: filesToSend },
        { onSuccess: () => onCompleted?.() },
      );
    })();
  }

  const savedUrls = attachmentURLs.length > 0 ? attachmentURLs : attachmentURL ? [attachmentURL] : [];
  const showSavedAttachments = savedUrls.length > 0;

  return (
    <div className="space-y-4">
      {hasEmail && (
        <>
          {preview.isPending && !hydratedFromCompleted ? (
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
                <Label htmlFor="wf-up-cc">{t('workflow.panel.cc')}</Label>
                <Input
                  id="wf-up-cc"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder={t('workflow.panel.ccPlaceholder')}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wf-up-subject">{t('workflow.panel.subject')}</Label>
                <Input id="wf-up-subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} disabled={disabled} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('workflow.panel.content')}</Label>
                <RichTextEditor value={emailContent} onChange={setEmailContent} disabled={disabled} />
              </div>
            </>
          )}
        </>
      )}

      {isIgUpload && preview.isPending && !hydratedFromCompleted && !showSavedAttachments ? (
        <div className="text-muted-foreground flex items-center gap-2 py-4 text-sm">
          <Loader2 className="size-4 animate-spin" /> {t('workflow.panel.previewLoading')}
        </div>
      ) : null}

      {/* Done / 已存附件：可点击预览(预签名 URL) */}
      {showSavedAttachments ? (
        <div className="space-y-2">
          <Label>{t('workflow.panel.uploadedFiles')}</Label>
          <ul className="space-y-3">
            {savedUrls.map((url, i) => (
              <li key={`${url}-${i}`} className="rounded-md border p-3">
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary mb-2 inline-flex items-center gap-1.5 text-sm font-medium underline"
                >
                  <ExternalLink className="size-3.5" />
                  {fileLabel(url, i, fileNames)}
                </a>
                {isImageUrl(url) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt={fileLabel(url, i, fileNames)}
                    className="mt-2 max-h-96 w-full rounded-md border object-contain"
                  />
                ) : (
                  <iframe
                    title={fileLabel(url, i, fileNames)}
                    src={url}
                    className="mt-2 h-80 w-full rounded-md border"
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* 新上传(编辑模式) */}
      {!disabled ? (
        <div className="space-y-1.5">
          <Label htmlFor="wf-up-files">
            {hasEmail
              ? t('workflow.panel.attachmentsLabel')
              : step.multiFile
                ? t('workflow.panel.uploadFilesLabel')
                : t('workflow.panel.uploadFileLabel')}
            {hasEmail && (
              <span className="text-muted-foreground font-normal"> {t('workflow.panel.optional')}</span>
            )}
          </Label>
          <Input
            id="wf-up-files"
            type="file"
            multiple={step.multiFile || hasEmail}
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
      ) : null}

      {!disabled ? (
        <div className="flex flex-wrap items-center gap-2">
          {step.preview && (
            <Button
              type="button"
              variant="outline"
              disabled={preview.isPending}
              onClick={() =>
                previewMutate(buildStepBase(projectId, step, { isTransfer: false }), {
                  onSuccess: (pw?: ProjectWorkflowDto) => applyPayload(pw),
                })
              }
            >
              <Eye className="size-4" /> {t('workflow.actions.updatePreview')}
            </Button>
          )}
          <Button type="button" disabled={execMut.isPending} onClick={handleSubmit}>
            {execMut.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : hasEmail ? (
              <Send className="size-4" />
            ) : (
              <Upload className="size-4" />
            )}
            {hasEmail ? t('workflow.actions.sendWithAttachment') : t('workflow.actions.uploadAndComplete')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
