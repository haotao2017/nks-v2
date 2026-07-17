'use client';

/**
 * 新建/编辑检查项(子项)弹窗 —— 照抄 step-form-dialog 模式。
 * 字段:title(必填)。创建时带上所属模板的 checklistId(= templateId)。
 * 注:后端 ChecklistItemTemplateDto 的 sortOrder 为 @JsonIgnore,不出现在 JSON,故不在表单里维护。
 */
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import type { ChecklistItemTemplateDto } from '@nks/api-types';

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

import { useCreateChecklistItem, useUpdateChecklistItem } from './api';

/** 校验消息随语言变化,故 schema 按 t 构建。 */
const makeItemSchema = (t: TFunction) =>
  z.object({
    title: z.string().trim().min(1, t('checklists.items.validation.titleRequired')),
  });

type ItemFormValues = z.infer<ReturnType<typeof makeItemSchema>>;

export interface ChecklistItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: number;
  /** 传入即编辑模式;undefined 为新建。 */
  item?: ChecklistItemTemplateDto;
}

export function ChecklistItemFormDialog({
  open,
  onOpenChange,
  templateId,
  item,
}: ChecklistItemFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(item?.id);
  const createMutation = useCreateChecklistItem(templateId);
  const updateMutation = useUpdateChecklistItem(templateId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const itemSchema = React.useMemo(() => makeItemSchema(t), [t]);

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: { title: '' },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({ title: item?.title ?? '' });
    }
  }, [open, item, form]);

  const onSubmit = form.handleSubmit((values) => {
    const payload: ChecklistItemTemplateDto = {
      ...(item?.id ? { id: item.id } : {}),
      checklistId: templateId,
      title: values.title,
    };

    const mutation = isEdit ? updateMutation : createMutation;
    mutation.mutate(payload, { onSuccess: () => onOpenChange(false) });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t('checklists.items.form.editTitle')
              : t('checklists.items.form.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t('checklists.items.form.editDescription')
              : t('checklists.items.form.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('checklists.items.form.title')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('checklists.items.form.titlePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
