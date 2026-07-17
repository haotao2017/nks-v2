'use client';

/**
 * 新建/编辑邮件模板弹窗 —— 照抄 contact-form-dialog 模式,但 template 用富文本编辑器。
 *
 * - title 用 react-hook-form + zod(必填)。
 * - template(HTML)因是非标准输入,用本地 state 承接 RichTextEditor 的 onChange,
 *   提交时并入 payload。
 * - 提交成功后关闭弹窗;失败 toast 由 api hook 统一处理。
 */
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import type { EmailTemplateDto } from '@nks/api-types';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useCreateEmailTemplate, useUpdateEmailTemplate, useEmailHashtags } from './api';
import { RichTextEditor } from './rich-text-editor';

/** 校验消息随语言变化,故 schema 在组件内按 t 重建。 */
type TemplateFormValues = {
  title: string;
};

export interface EmailTemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 传入即编辑模式;undefined 为新建。 */
  emailTemplate?: EmailTemplateDto;
}

export function EmailTemplateFormDialog({
  open,
  onOpenChange,
  emailTemplate,
}: EmailTemplateFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(emailTemplate?.id);
  const createMutation = useCreateEmailTemplate();
  const updateMutation = useUpdateEmailTemplate();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const { data: hashtags = [], isLoading: hashtagsLoading } = useEmailHashtags();

  const [templateHtml, setTemplateHtml] = React.useState('');

  const templateSchema = React.useMemo(
    () =>
      z.object({
        title: z.string().trim().min(1, t('emailTemplates.validation.titleRequired')),
      }),
    [t],
  );

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: { title: '' },
  });

  // 每次打开时同步:富文本本地草稿用渲染期调整重置(不在 effect 内 setState,避免级联渲染)。
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setTemplateHtml(emailTemplate?.template ?? '');
  }

  // title 走 react-hook-form:reset 是 RHF 内部同步,放 effect(非本地 state 的级联 setState)。
  React.useEffect(() => {
    if (open) form.reset({ title: emailTemplate?.title ?? '' });
  }, [open, emailTemplate, form]);

  const onSubmit = form.handleSubmit((values) => {
    const payload: EmailTemplateDto = {
      ...(emailTemplate?.id ? { id: emailTemplate.id } : {}),
      title: values.title,
      template: templateHtml,
    };

    const mutation = isEdit ? updateMutation : createMutation;
    mutation.mutate(payload, {
      onSuccess: () => onOpenChange(false),
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('emailTemplates.form.editTitle') : t('emailTemplates.form.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t('emailTemplates.form.editDescription')
              : t('emailTemplates.form.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('emailTemplates.form.title')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('emailTemplates.form.titlePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label>{t('emailTemplates.form.content')}</Label>
              <RichTextEditor
                value={templateHtml}
                onChange={setTemplateHtml}
                hashtags={hashtags}
                hashtagsLoading={hashtagsLoading}
                disabled={isPending}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? t('common.save') : t('common.create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
