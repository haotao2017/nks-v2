'use client';

/**
 * 新建/编辑工作流步骤弹窗。
 * 字段:stepName(必填)、stepSequence(数字)、isActive(switch)、isTransferable(switch)。
 * 创建时自动带上所属分类的 workflowCategoryId。
 */
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import type { WorkflowCategoryStepDto } from '@nks/api-types';

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

import { useCreateWorkflowCategoryStep, useUpdateWorkflowCategoryStep } from './api';

/** 校验消息随语言变化,故 schema 按 t 构建。 */
const makeStepSchema = (t: TFunction) =>
  z.object({
    stepName: z.string().trim().min(1, t('workflowCategories.steps.validation.nameRequired')),
    stepSequence: z
      .number()
      .int(t('workflowCategories.steps.validation.sequenceInt'))
      .min(0, t('workflowCategories.steps.validation.sequenceMin')),
    isActive: z.boolean(),
    isTransferable: z.boolean(),
  });

type StepFormValues = z.infer<ReturnType<typeof makeStepSchema>>;

export interface StepFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: number;
  /** 传入即编辑模式;undefined 为新建。 */
  step?: WorkflowCategoryStepDto;
  /** 新建时默认的 stepSequence(通常是当前步骤数 + 1)。 */
  defaultSequence?: number;
}

export function StepFormDialog({
  open,
  onOpenChange,
  categoryId,
  step,
  defaultSequence = 1,
}: StepFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(step?.id);
  const createMutation = useCreateWorkflowCategoryStep(categoryId);
  const updateMutation = useUpdateWorkflowCategoryStep(categoryId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const stepSchema = React.useMemo(() => makeStepSchema(t), [t]);

  const form = useForm<StepFormValues>({
    resolver: zodResolver(stepSchema),
    defaultValues: {
      stepName: '',
      stepSequence: defaultSequence,
      isActive: true,
      isTransferable: false,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        stepName: step?.stepName ?? '',
        stepSequence: step?.stepSequence ?? defaultSequence,
        isActive: step?.isActive ?? true,
        isTransferable: step?.isTransferable ?? false,
      });
    }
  }, [open, step, defaultSequence, form]);

  const onSubmit = form.handleSubmit((values) => {
    const payload: WorkflowCategoryStepDto = {
      ...(step?.id ? { id: step.id } : {}),
      workflowCategoryId: categoryId,
      stepName: values.stepName,
      stepSequence: values.stepSequence,
      isActive: values.isActive,
      isTransferable: values.isTransferable,
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
              ? t('workflowCategories.steps.form.editTitle')
              : t('workflowCategories.steps.form.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t('workflowCategories.steps.form.editDescription')
              : t('workflowCategories.steps.form.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="stepName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('workflowCategories.steps.form.name')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('workflowCategories.steps.form.namePlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stepSequence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('workflowCategories.steps.form.sequence')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      value={Number.isFinite(field.value) ? field.value : ''}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === '' ? undefined : e.target.valueAsNumber,
                        )
                      }
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4 rounded-md border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t('workflowCategories.steps.form.active')}</FormLabel>
                    <FormDescription>
                      {t('workflowCategories.steps.form.activeDescription')}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isTransferable"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4 rounded-md border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t('workflowCategories.steps.form.transferable')}</FormLabel>
                    <FormDescription>
                      {t('workflowCategories.steps.form.transferableDescription')}
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
