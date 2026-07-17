'use client';

/**
 * EmailStepPanel —— email 类型步骤的通用面板(WF1/4/8/9/12)。
 *
 * 流程:进入步骤 → 调 GetXxxEmailFormated 取预览(emailFrom/emailTo/emailSubject/emailContent)
 * → 富文本编辑正文、可改主题/收件人 → 执行(wfXxx)或发信(wfXxxSendEmail)。
 * WF8/9 额外带「Overfør」(transfer)按钮:不发信直接推进。
 * WF9(multiRecipient)预览返回按参与方的列表 emailProjectParties.emailProjectPartiesWorkflowList[],
 * 逐个参与方编辑正文/收件人后一并发送。
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Eye, Send, FastForward, Loader2 } from 'lucide-react';

import type { EmailProjectPartiesWorkflowEntDto, ProjectWorkflowDto } from '@nks/api-types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/features/email-templates/rich-text-editor';

import type { WorkflowStepDef } from './workflow-steps';
import {
  buildStepBase,
  useEmailPreview,
  useExecuteStepJson,
  useSendEmail,
  useTransferStep,
} from './workflow-api';

interface EmailStepPanelProps {
  projectId: number;
  step: WorkflowStepDef;
  disabled?: boolean;
}

/** 外部文档上传基址(与旧 admin 的 BaseURLSite 一致)。 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? '';

export function EmailStepPanel({ projectId, step, disabled }: EmailStepPanelProps) {
  const { t } = useTranslation();
  const preview = useEmailPreview(step.preview);
  // 发信端点:优先 sendEmail(WF8/9),否则普通 execute(WF1/4/12)。
  const sendMut = useSendEmail(projectId, step, step.sendEmail);
  const execMut = useExecuteStepJson(projectId, step, step.execute);
  const transferMut = useTransferStep(projectId, step, step.transfer);

  const [emailFrom, setEmailFrom] = React.useState('');
  const [emailTo, setEmailTo] = React.useState('');
  const [emailSubject, setEmailSubject] = React.useState('');
  const [emailContent, setEmailContent] = React.useState('');
  const [parties, setParties] = React.useState<EmailProjectPartiesWorkflowEntDto[]>([]);
  // 无预览步骤直接视为已加载;组件按 step.key 重挂载,故初值即等价于旧的进入时重置。
  const [loaded, setLoaded] = React.useState(!step.preview);

  // 进入步骤时自动取预览一次(setState 仅在 mutation 异步回调里,非 effect 体内同步调用)。
  const previewMutate = preview.mutate;
  React.useEffect(() => {
    if (!step.preview) return;
    previewMutate(buildStepBase(projectId, step, { isTransfer: false }), {
      onSuccess: (pw?: ProjectWorkflowDto) => {
        setEmailFrom(pw?.emailFrom ?? '');
        setEmailTo(pw?.emailTo ?? '');
        setEmailSubject(pw?.emailSubject ?? '');
        setEmailContent(pw?.emailContent ?? '');
        setParties(pw?.emailProjectParties?.emailProjectPartiesWorkflowList ?? []);
        setLoaded(true);
      },
      onError: () => setLoaded(true),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, step.key]);

  const isMulti = step.multiRecipient && parties.length > 0;
  const busy = sendMut.isPending || execMut.isPending || transferMut.isPending;

  function updateParty(idx: number, patch: Partial<EmailProjectPartiesWorkflowEntDto>) {
    setParties((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  }

  function handleSend() {
    const useSend = Boolean(step.sendEmail);
    if (isMulti) {
      const list = parties.map((p) => ({ ...p, sendEmail: true }));
      const extra: Partial<ProjectWorkflowDto> = {
        isTransfer: false,
        emailContent: '',
        emailSubject: '',
        emailTo: '',
        emailFrom,
        emailProjectParties: { emailProjectPartiesWorkflowList: list },
        baseURLSite: SITE_URL ? `${SITE_URL}/external/UploadDocument` : undefined,
      };
      if (useSend) sendMut.mutate(extra as ProjectWorkflowDto);
      else execMut.mutate(extra as ProjectWorkflowDto);
      return;
    }
    const extra: Partial<ProjectWorkflowDto> = {
      isTransfer: false,
      emailFrom,
      emailTo,
      emailSubject,
      emailContent,
    };
    if (useSend) sendMut.mutate(extra as ProjectWorkflowDto);
    else execMut.mutate(extra as ProjectWorkflowDto);
  }

  if (preview.isPending && !loaded) {
    return <LoadingPreview />;
  }

  return (
    <div className="space-y-4">
      {!isMulti ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="wf-email-from">{t('workflow.panel.from')}</Label>
              <Input
                id="wf-email-from"
                value={emailFrom}
                onChange={(e) => setEmailFrom(e.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wf-email-to">{t('workflow.panel.to')}</Label>
              <Input
                id="wf-email-to"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                disabled={disabled}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wf-email-subject">{t('workflow.panel.subject')}</Label>
            <Input
              id="wf-email-subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('workflow.panel.content')}</Label>
            <RichTextEditor value={emailContent} onChange={setEmailContent} disabled={disabled} />
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">{t('workflow.panel.multiHint')}</p>
          {parties.map((p, idx) => (
            <div key={`${p.partyTypeID ?? idx}`} className="rounded-md border p-3">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Mail className="text-muted-foreground size-4" />
                {p.partyTypeName || p.partyName || t('workflow.panel.partFallback', { n: idx + 1 })}
              </p>
              <div className="space-y-1.5">
                <Label htmlFor={`wf-party-to-${idx}`}>{t('workflow.panel.to')}</Label>
                <Input
                  id={`wf-party-to-${idx}`}
                  value={p.emailTo ?? ''}
                  onChange={(e) => updateParty(idx, { emailTo: e.target.value })}
                  disabled={disabled}
                />
              </div>
              <div className="mt-2 space-y-1.5">
                <Label htmlFor={`wf-party-title-${idx}`}>{t('workflow.panel.subject')}</Label>
                <Input
                  id={`wf-party-title-${idx}`}
                  value={p.title ?? ''}
                  onChange={(e) => updateParty(idx, { title: e.target.value })}
                  disabled={disabled}
                />
              </div>
              <div className="mt-2 space-y-1.5">
                <Label>{t('workflow.panel.content')}</Label>
                <RichTextEditor
                  value={p.content ?? ''}
                  onChange={(html) => updateParty(idx, { content: html })}
                  disabled={disabled}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {preview.isError && (
        <p className="text-destructive text-sm">{t('workflow.panel.previewError')}</p>
      )}

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
                  setParties(pw?.emailProjectParties?.emailProjectPartiesWorkflowList ?? []);
                },
              })
            }
          >
            {preview.isPending ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
            {t('workflow.actions.updatePreview')}
          </Button>
        )}
        <Button type="button" disabled={disabled || busy} onClick={handleSend}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {step.sendEmail ? t('workflow.actions.sendEmail') : t('workflow.actions.completeStep')}
        </Button>
        {step.transfer && (
          <Button
            type="button"
            variant="secondary"
            disabled={disabled || busy}
            onClick={() => transferMut.mutate()}
          >
            <FastForward className="size-4" />
            {t('workflow.actions.transferWithoutSending')}
          </Button>
        )}
      </div>
    </div>
  );
}

function LoadingPreview() {
  const { t } = useTranslation();
  return (
    <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
      <Loader2 className="size-4 animate-spin" />
      {t('workflow.panel.emailPreviewLoading')}
    </div>
  );
}
