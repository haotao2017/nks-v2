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
import { Mail, Eye, Send, FastForward, Loader2, X, Plus, FileText } from 'lucide-react';

import type { EmailProjectPartiesWorkflowEntDto, ProjectWorkflowDto } from '@nks/api-types';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { ProjectLeaderSection } from './project-leader-section';

interface EmailStepPanelProps {
  projectId: number;
  step: WorkflowStepDef;
  disabled?: boolean;
  onCompleted?: () => void;
  /** Done 打开时：已完成步骤回填的最终邮件内容（优先于模板预览）。 */
  completedData?: ProjectWorkflowDto | null;
}

function hasSentEmailContent(data?: ProjectWorkflowDto | null): boolean {
  if (!data) return false;
  if (data.emailContent || data.emailSubject || data.emailTo || data.emailFrom || data.cc) return true;
  if ((data.emailHistoryId ?? 0) > 0) return true;
  if ((data.emailProjectPartiesSent?.length ?? 0) > 0) return true;
  if (data.attachmentURL || (data.attachmentURLs?.length ?? 0) > 0) return true;
  return false;
}

/** 对齐旧 Wf1S10:同一 partyType 只保留一条(后出现的覆盖先前的)。 */
function dedupePartiesByType(
  list: EmailProjectPartiesWorkflowEntDto[],
): EmailProjectPartiesWorkflowEntDto[] {
  const byType = new Map<number, EmailProjectPartiesWorkflowEntDto>();
  const noType: EmailProjectPartiesWorkflowEntDto[] = [];
  for (const p of list) {
    if (p.partyTypeID == null) {
      noType.push(p);
      continue;
    }
    byType.set(p.partyTypeID, p);
  }
  return [...byType.values(), ...noType];
}

/** 外部文档上传基址(与旧 admin 的 BaseURLSite 一致)；空 env 时回退到当前 origin。 */
function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  if (configured) return configured;
  return typeof window !== 'undefined' ? window.location.origin : '';
}

export function EmailStepPanel({
  projectId,
  step,
  disabled,
  onCompleted,
  completedData,
}: EmailStepPanelProps) {
  const { t } = useTranslation();
  const preview = useEmailPreview(step.preview);
  // 发信端点:优先 sendEmail(WF8/9),否则普通 execute(WF1/4/12)。
  const sendMut = useSendEmail(projectId, step, step.sendEmail);
  const execMut = useExecuteStepJson(projectId, step, step.execute);
  const transferMut = useTransferStep(projectId, step, step.transfer);

  const [emailFrom, setEmailFrom] = React.useState('');
  const [emailTo, setEmailTo] = React.useState('');
  const [cc, setCc] = React.useState('');
  const [emailSubject, setEmailSubject] = React.useState('');
  const [emailContent, setEmailContent] = React.useState('');
  const [attachmentURLs, setAttachmentURLs] = React.useState<string[]>([]);
  const [parties, setParties] = React.useState<EmailProjectPartiesWorkflowEntDto[]>([]);
  // multiRecipient(WF9):被移除(排除发送)的参与方索引;仅保留者提交 sendEmail:true。
  const [excluded, setExcluded] = React.useState<Set<number>>(new Set());
  // WF8:Kopier til prosjektleder → 发信时带 projectLeaderEmailTo。
  const [ccProjectLeader, setCcProjectLeader] = React.useState(false);
  const [projectLeaderEmailTo, setProjectLeaderEmailTo] = React.useState('');
  // 无预览步骤 / 已有完成数据 → 直接视为已加载。
  const [loaded, setLoaded] = React.useState(!step.preview || hasSentEmailContent(completedData));

  // 进入步骤:优先展示 Done 回填的最终内容;纯 Overført 不拉模板;否则拉模板预览。
  const previewMutate = preview.mutate;
  React.useEffect(() => {
    if (hasSentEmailContent(completedData)) {
      const sent = completedData!;
      setEmailFrom(sent.emailFrom ?? '');
      setEmailTo(sent.emailTo ?? '');
      setCc(sent.cc ?? '');
      setEmailSubject(sent.emailSubject ?? '');
      setEmailContent(sent.emailContent ?? '');
      const urls = [
        ...(sent.attachmentURLs ?? []),
        ...(sent.fileUrls ?? []),
        ...(sent.attachmentURL ? [sent.attachmentURL] : []),
      ].filter(Boolean);
      setAttachmentURLs(Array.from(new Set(urls)));
      // WF9:把已发送记录映射成可展示的参与方列表
      if (sent.emailProjectPartiesSent?.length) {
        setParties(
          dedupePartiesByType(
            sent.emailProjectPartiesSent.map((s) => ({
              emailFrom: s.emailFrom,
              emailTo: s.emailTo,
              title: s.emailSubject,
              content: s.emailContent,
              partyID: s.partyID,
              partyTypeID: s.partyTypeID,
              sendEmail: true,
            })),
          ),
        );
      } else {
        setParties([]);
      }
      setExcluded(new Set());
      setProjectLeaderEmailTo(sent.projectLeaderEmailTo ?? '');
      setCcProjectLeader(false);
      setLoaded(true);
      return;
    }
    // Done 里纯推进、无邮件历史：不要用模板冒充已发内容
    if (completedData && completedData.isTransfer) {
      setLoaded(true);
      return;
    }
    if (!step.preview) return;
    previewMutate(buildStepBase(projectId, step, { isTransfer: false }), {
      onSuccess: (pw?: ProjectWorkflowDto) => {
        setEmailFrom(pw?.emailFrom ?? '');
        setEmailTo(pw?.emailTo ?? '');
        setCc(pw?.cc ?? '');
        setEmailSubject(pw?.emailSubject ?? '');
        setEmailContent(pw?.emailContent ?? '');
        const urls = [
          ...(pw?.attachmentURLs ?? []),
          ...(pw?.fileUrls ?? []),
          ...(pw?.attachmentURL ? [pw.attachmentURL] : []),
        ].filter(Boolean);
        setAttachmentURLs(Array.from(new Set(urls)));
        setParties(
          dedupePartiesByType(pw?.emailProjectParties?.emailProjectPartiesWorkflowList ?? []),
        );
        setExcluded(new Set());
        setProjectLeaderEmailTo(pw?.projectLeaderEmailTo ?? '');
        setCcProjectLeader(false);
        setLoaded(true);
      },
      onError: () => setLoaded(true),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, step.key, completedData?.emailHistoryId, completedData?.emailContent, completedData?.isTransfer]);

  const isMulti = step.multiRecipient && parties.length > 0;
  const keptCount = parties.length - excluded.size;
  const busy = sendMut.isPending || execMut.isPending || transferMut.isPending;

  function updateParty(idx: number, patch: Partial<EmailProjectPartiesWorkflowEntDto>) {
    setParties((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  }

  // 移除/重新加入某收件人(WF9):被移除者不进入待发集合。
  function excludeParty(idx: number) {
    setExcluded((prev) => new Set(prev).add(idx));
  }
  function reincludeParty(idx: number) {
    setExcluded((prev) => {
      const next = new Set(prev);
      next.delete(idx);
      return next;
    });
  }

  function handleSend() {
    const useSend = Boolean(step.sendEmail);
    const siteUrl = resolveSiteUrl();
    if (isMulti) {
      // 仅保留(未被移除)的参与方进入列表并置 sendEmail:true(对齐旧 Wf1S10 toSendIds 语义)。
      const list = parties
        .filter((_, i) => !excluded.has(i))
        .map((p) => ({ ...p, sendEmail: true }));
      const extra: Partial<ProjectWorkflowDto> = {
        isTransfer: false,
        emailContent: '',
        emailSubject: '',
        emailTo: '',
        emailFrom,
        cc: cc.trim() || undefined,
        emailProjectParties: { emailProjectPartiesWorkflowList: list },
        baseURLSite: siteUrl ? `${siteUrl}/external/upload-document` : undefined,
      };
      if (useSend) sendMut.mutate(extra as ProjectWorkflowDto, { onSuccess: () => onCompleted?.() });
      else execMut.mutate(extra as ProjectWorkflowDto, { onSuccess: () => onCompleted?.() });
      return;
    }
    const extra: Partial<ProjectWorkflowDto> = {
      isTransfer: false,
      emailFrom,
      emailTo,
      cc: cc.trim() || undefined,
      emailSubject,
      emailContent,
    };
    if (step.projectLeaderCc && ccProjectLeader && projectLeaderEmailTo) {
      extra.projectLeaderEmailTo = projectLeaderEmailTo;
    }
    if (useSend) sendMut.mutate(extra as ProjectWorkflowDto, { onSuccess: () => onCompleted?.() });
    else execMut.mutate(extra as ProjectWorkflowDto, { onSuccess: () => onCompleted?.() });
  }

  if (preview.isPending && !loaded) {
    return <LoadingPreview />;
  }

  return (
    <div className="space-y-4">
      {step.projectLeader && (
        <ProjectLeaderSection projectId={projectId} disabled={disabled} />
      )}

      {!isMulti ? (
        <>
          {step.projectLeaderCc && (
            <label className="flex items-center justify-end gap-2 text-sm">
              <Checkbox
                checked={ccProjectLeader}
                onCheckedChange={(v) => setCcProjectLeader(v === true)}
                disabled={disabled || !projectLeaderEmailTo}
              />
              {t('workflow.leader.copyToLeader')}
              {!projectLeaderEmailTo ? (
                <span className="text-muted-foreground text-xs">
                  ({t('workflow.leader.noLeaderEmail')})
                </span>
              ) : null}
            </label>
          )}
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
            <Label htmlFor="wf-email-cc">{t('workflow.panel.cc')}</Label>
            <Input
              id="wf-email-cc"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder={t('workflow.panel.ccPlaceholder')}
              disabled={disabled}
            />
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
          {attachmentURLs.length > 0 ? (
            <div className="space-y-2">
              <Label>{t('workflow.panel.uploadedFiles')}</Label>
              <ul className="space-y-2">
                {attachmentURLs.map((url, i) => (
                  <li key={`${url}-${i}`}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary inline-flex items-center gap-1.5 text-sm underline"
                    >
                      <FileText className="size-3.5" />
                      {t('workflow.panel.attachmentsLabel')} {i + 1}
                    </a>
                    <iframe title={`att-${i}`} src={url} className="mt-2 h-64 w-full rounded-md border" />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : (
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">{t('workflow.panel.multiHint')}</p>
          <div className="space-y-1.5">
            <Label htmlFor="wf-email-cc-multi">{t('workflow.panel.cc')}</Label>
            <Input
              id="wf-email-cc-multi"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder={t('workflow.panel.ccPlaceholder')}
              disabled={disabled}
            />
          </div>
          {excluded.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed p-2">
              <span className="text-muted-foreground text-xs font-medium">
                {t('workflow.panel.addRecipient')}
              </span>
              {parties.map((p, idx) =>
                excluded.has(idx) ? (
                  <Button
                    key={`re-${p.partyTypeID ?? idx}`}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-7 gap-1 px-2"
                    disabled={disabled}
                    onClick={() => reincludeParty(idx)}
                  >
                    <Plus className="size-3.5" />
                    {p.partyTypeName ||
                      p.partyName ||
                      t('workflow.panel.partFallback', { n: idx + 1 })}
                  </Button>
                ) : null,
              )}
            </div>
          )}
          {keptCount === 0 && (
            <p className="text-muted-foreground text-sm">{t('workflow.panel.noRecipients')}</p>
          )}
          {parties.map((p, idx) =>
            excluded.has(idx) ? null : (
            <div key={`${p.partyTypeID ?? idx}`} className="rounded-md border p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="text-muted-foreground size-4" />
                  {p.partyTypeName || p.partyName || t('workflow.panel.partFallback', { n: idx + 1 })}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2"
                  disabled={disabled}
                  onClick={() => excludeParty(idx)}
                  title={t('workflow.panel.removeRecipient')}
                >
                  <X className="size-3.5" />
                  <span className="sr-only">{t('workflow.panel.removeRecipient')}</span>
                </Button>
              </div>
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
            ),
          )}
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
                  setCc(pw?.cc ?? '');
                  setEmailSubject(pw?.emailSubject ?? '');
                  setEmailContent(pw?.emailContent ?? '');
                  setParties(
          dedupePartiesByType(pw?.emailProjectParties?.emailProjectPartiesWorkflowList ?? []),
        );
                  setExcluded(new Set());
                },
              })
            }
          >
            {preview.isPending ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
            {t('workflow.actions.updatePreview')}
          </Button>
        )}
        <Button
          type="button"
          disabled={disabled || busy || (isMulti && keptCount === 0)}
          onClick={handleSend}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {step.sendEmail ? t('workflow.actions.sendEmail') : t('workflow.actions.completeStep')}
        </Button>
        {step.transfer && (
          <Button
            type="button"
            variant="secondary"
            disabled={disabled || busy}
            onClick={() => transferMut.mutate(undefined, { onSuccess: () => onCompleted?.() })}
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
