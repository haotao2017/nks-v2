'use client';

/**
 * 新建/编辑工作流分类弹窗 —— 照抄 contact-form-dialog 模式。
 * 字段:name(必填)+ isDefault(switch)。
 */
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import type { WorkflowCategoryDto } from '@nks/api-types';

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

import { useCreateWorkflowCategory, useUpdateWorkflowCategory } from './api';

/** 校验消息随语言变化,故 schema 在组件内按 t 重建。 */
type CategoryFormValues = {
  name: string;
  isDefault: boolean;
};

export interface WorkflowCategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 传入即编辑模式;undefined 为新建。 */
  category?: WorkflowCategoryDto;
}

export function WorkflowCategoryFormDialog({
  open,
  onOpenChange,
  category,
}: WorkflowCategoryFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(category?.id);
  const createMutation = useCreateWorkflowCategory();
  const updateMutation = useUpdateWorkflowCategory();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const categorySchema = React.useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t('workflowCategories.validation.nameRequired')),
        isDefault: z.boolean(),
      }),
    [t],
  );

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', isDefault: false },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: category?.name ?? '',
        isDefault: category?.isDefault ?? false,
      });
    }
  }, [open, category, form]);

  const onSubmit = form.handleSubmit((values) => {
    const payload: WorkflowCategoryDto = {
      ...(category?.id ? { id: category.id } : {}),
      name: values.name,
      isDefault: values.isDefault,
    };

    const mutation = isEdit ? updateMutation : createMutation;
    mutation.mutate(payload, {
      onSuccess: () => onOpenChange(false),
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t('workflowCategories.form.editTitle')
              : t('workflowCategories.form.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t('workflowCategories.form.editDescription')
              : t('workflowCategories.form.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('workflowCategories.form.name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('workflowCategories.form.namePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4 rounded-md border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t('workflowCategories.form.isDefault')}</FormLabel>
                    <FormDescription>
                      {t('workflowCategories.form.isDefaultDescription')}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
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
