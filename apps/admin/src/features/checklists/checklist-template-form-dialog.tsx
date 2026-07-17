'use client';

/**
 * 新建/编辑检查清单模板弹窗 —— 照抄 workflow-category-form-dialog 模式。
 *
 * - 新建模式:title + 一组子项(useFieldArray),整体走 CreatChecklistTemplateWithItems。
 * - 编辑模式:仅编辑 title(走 UpdateChecklistTemplate);子项在「管理子项」弹窗里单独增删改,
 *   故这里不下发 checklistItemTemplateList,避免覆盖后端已有子项。
 */
import * as React from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, X } from 'lucide-react';

import type { ChecklistTemplateDto } from '@nks/api-types';

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

import { useCreateChecklistTemplate, useUpdateChecklistTemplate } from './api';

const templateSchema = z.object({
  title: z.string().trim().min(1, 'Tittel er påkrevd'),
  items: z.array(
    z.object({
      title: z.string().trim().min(1, 'Tittel er påkrevd'),
    }),
  ),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

export interface ChecklistTemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 传入即编辑模式;undefined 为新建。 */
  template?: ChecklistTemplateDto;
}

export function ChecklistTemplateFormDialog({
  open,
  onOpenChange,
  template,
}: ChecklistTemplateFormDialogProps) {
  const isEdit = Boolean(template?.id);
  const createMutation = useCreateChecklistTemplate();
  const updateMutation = useUpdateChecklistTemplate();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: { title: '', items: [] },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        title: template?.title ?? '',
        items: [], // 编辑模式子项在单独弹窗管理;新建默认空
      });
    }
  }, [open, template, form]);

  const onSubmit = form.handleSubmit((values) => {
    if (isEdit) {
      // 仅更新标题,不下发子项数组(子项单独管理)。
      const payload: ChecklistTemplateDto = {
        id: template!.id,
        title: values.title,
      };
      updateMutation.mutate(payload, { onSuccess: () => onOpenChange(false) });
      return;
    }

    // 新建:标题 + 子项一并提交。
    const payload: ChecklistTemplateDto = {
      title: values.title,
      checklistItemTemplateList: values.items.map((item) => ({ title: item.title })),
    };
    createMutation.mutate(payload, { onSuccess: () => onOpenChange(false) });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Rediger sjekkliste' : 'Ny sjekkliste'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Oppdater sjekklisten nedenfor.'
              : 'Fyll ut tittel og legg eventuelt til sjekkpunkter.'}
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
                    <Input placeholder="F.eks. Standard sjekkliste" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 子项字段数组仅在新建模式显示 */}
            {!isEdit && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <FormLabel>Sjekkpunkter</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ title: '' })}
                  >
                    <Plus className="size-4" />
                    Legg til
                  </Button>
                </div>

                {fields.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Ingen sjekkpunkter enda. Du kan også legge dem til senere.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {fields.map((fieldItem, index) => (
                      <FormField
                        key={fieldItem.id}
                        control={form.control}
                        name={`items.${index}.title`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Input placeholder={`Sjekkpunkt ${index + 1}`} {...field} />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-9 shrink-0"
                                  onClick={() => remove(index)}
                                >
                                  <X className="size-4" />
                                  <span className="sr-only">Fjern</span>
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

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
