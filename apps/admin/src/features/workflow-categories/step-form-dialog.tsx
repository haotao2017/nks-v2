'use client';

/**
 * 新建/编辑工作流步骤弹窗。
 * 字段:stepName(必填)、stepSequence(数字)、isActive(switch)、isTransferable(switch)。
 * 创建时自动带上所属分类的 workflowCategoryId。
 */
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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

const stepSchema = z.object({
  stepName: z.string().trim().min(1, 'Stegnavn er påkrevd'),
  stepSequence: z
    .number()
    .int('Rekkefølge må være et heltall')
    .min(0, 'Kan ikke være negativt'),
  isActive: z.boolean(),
  isTransferable: z.boolean(),
});

type StepFormValues = z.infer<typeof stepSchema>;

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
  const isEdit = Boolean(step?.id);
  const createMutation = useCreateWorkflowCategoryStep(categoryId);
  const updateMutation = useUpdateWorkflowCategoryStep(categoryId);
  const isPending = createMutation.isPending || updateMutation.isPending;

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
          <DialogTitle>{isEdit ? 'Rediger steg' : 'Nytt steg'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Oppdater steget nedenfor.' : 'Fyll ut informasjonen for det nye steget.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="stepName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stegnavn</FormLabel>
                  <FormControl>
                    <Input placeholder="F.eks. Befaring" {...field} />
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
                  <FormLabel>Rekkefølge</FormLabel>
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
                    <FormLabel>Aktiv</FormLabel>
                    <FormDescription>Steget er aktivt i arbeidsflyten.</FormDescription>
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
                    <FormLabel>Overførbar</FormLabel>
                    <FormDescription>Steget kan overføres.</FormDescription>
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
                Avbryt
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? 'Lagre' : 'Opprett'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
