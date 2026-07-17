'use client';

/**
 * 新建/编辑检查项(子项)弹窗 —— 照抄 step-form-dialog 模式。
 * 字段:title(必填)。创建时带上所属模板的 checklistId(= templateId)。
 * 注:后端 ChecklistItemTemplateDto 的 sortOrder 为 @JsonIgnore,不出现在 JSON,故不在表单里维护。
 */
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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

const itemSchema = z.object({
  title: z.string().trim().min(1, 'Tittel er påkrevd'),
});

type ItemFormValues = z.infer<typeof itemSchema>;

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
  const isEdit = Boolean(item?.id);
  const createMutation = useCreateChecklistItem(templateId);
  const updateMutation = useUpdateChecklistItem(templateId);
  const isPending = createMutation.isPending || updateMutation.isPending;

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
          <DialogTitle>{isEdit ? 'Rediger sjekkpunkt' : 'Nytt sjekkpunkt'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Oppdater sjekkpunktet nedenfor.'
              : 'Fyll ut tittelen for det nye sjekkpunktet.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tittel</FormLabel>
                  <FormControl>
                    <Input placeholder="F.eks. Kontroller fundament" {...field} />
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
