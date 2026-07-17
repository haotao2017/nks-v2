'use client';

/**
 * 新建/编辑工作流分类弹窗 —— 照抄 contact-form-dialog 模式。
 * 字段:name(必填)+ isDefault(switch)。
 */
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Navn er påkrevd'),
  isDefault: z.boolean(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

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
  const isEdit = Boolean(category?.id);
  const createMutation = useCreateWorkflowCategory();
  const updateMutation = useUpdateWorkflowCategory();
  const isPending = createMutation.isPending || updateMutation.isPending;

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
          <DialogTitle>{isEdit ? 'Rediger arbeidsflyt' : 'Ny arbeidsflyt'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Oppdater arbeidsflyten nedenfor.'
              : 'Fyll ut informasjonen for å opprette en ny arbeidsflyt.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Navn</FormLabel>
                  <FormControl>
                    <Input placeholder="F.eks. Standard inspeksjon" {...field} />
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
                    <FormLabel>Standard</FormLabel>
                    <FormDescription>Bruk denne arbeidsflyten som standard.</FormDescription>
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
