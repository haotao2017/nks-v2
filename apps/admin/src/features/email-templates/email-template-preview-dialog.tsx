'use client';

/**
 * 预览弹窗 —— 渲染邮件模板的 HTML(dangerouslySetInnerHTML)。
 * 内容来自受信任的自家后端模板,仅供后台管理员预览。
 */
import type { EmailTemplateDto } from '@nks/api-types';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface EmailTemplatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emailTemplate?: EmailTemplateDto;
}

export function EmailTemplatePreviewDialog({
  open,
  onOpenChange,
  emailTemplate,
}: EmailTemplatePreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{emailTemplate?.title || 'Forhåndsvisning'}</DialogTitle>
          <DialogDescription>Forhåndsvisning av malen slik den vil se ut.</DialogDescription>
        </DialogHeader>

        <div className="rounded-md border p-4">
          {emailTemplate?.template ? (
            <div
              className="rte-content"
              dangerouslySetInnerHTML={{ __html: emailTemplate.template }}
            />
          ) : (
            <p className="text-muted-foreground text-sm">Ingen innhold.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
