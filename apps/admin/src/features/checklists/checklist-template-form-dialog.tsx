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
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { z } from 'zod';
import { FileText, Loader2, Plus, X } from 'lucide-react';

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

/** 校验消息随语言变化,故 schema 按 t 构建。 */
const makeTemplateSchema = (t: TFunction) =>
  z.object({
    title: z.string().trim().min(1, t('checklists.validation.titleRequired')),
    items: z.array(
      z.object({
        title: z.string().trim().min(1, t('checklists.items.validation.titleRequired')),
      }),
    ),
  });

type TemplateFormValues = z.infer<ReturnType<typeof makeTemplateSchema>>;

/** 「使用模板」预填内容 —— 照抄旧系统 templateOne(Våtrom 湿室检查清单,9 条)。 */
const VATROM_TEMPLATE_TITLE = 'Våtrom';
const VATROM_TEMPLATE_ITEMS: { title: string }[] = [
  { title: 'Hvilket stadie er våtrommet på?' },
  { title: 'Sjekk at hovedsluk er plassert i plan og høyde som prosjektert. ' },
  {
    title:
      'Er produktene som er blitt benyttet de samme som det er mottatt produktdokumentasjon på?',
  },
  {
    title:
      'Foreta en visuell kontroll om produktene membran, slukmansjett og slik er benyttet korrekt i henhold til produktdokumentasjon.',
  },
  {
    title:
      'Er det laget avrenning fra innebygd sisterne eller benyttet godkjent bagløsning?',
  },
  { title: 'Framstår arbeidene som er utført uten åpenbare avvik?' },
  {
    title:
      'Sjekk at det er samsvar mellom produksjonsunderlaget på byggeplass og mottatte tegningslister. (stikkprøve)',
  },
  { title: 'Godkjent fall til sluk?' },
  { title: 'Eventuelle kommentarer?' },
];

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
  const { t } = useTranslation();
  const isEdit = Boolean(template?.id);
  const createMutation = useCreateChecklistTemplate();
  const updateMutation = useUpdateChecklistTemplate();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const templateSchema = React.useMemo(() => makeTemplateSchema(t), [t]);

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
          <DialogTitle>
            {isEdit ? t('checklists.form.editTitle') : t('checklists.form.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t('checklists.form.editDescription')
              : t('checklists.form.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('checklists.form.title')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('checklists.form.titlePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 子项字段数组仅在新建模式显示 */}
            {!isEdit && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <FormLabel>{t('checklists.form.itemsLabel')}</FormLabel>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        form.reset({
                          title: VATROM_TEMPLATE_TITLE,
                          items: VATROM_TEMPLATE_ITEMS.map((item) => ({ title: item.title })),
                        })
                      }
                    >
                      <FileText className="size-4" />
                      {t('checklists.form.useTemplate')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ title: '' })}
                    >
                      <Plus className="size-4" />
                      {t('common.add')}
                    </Button>
                  </div>
                </div>

                {fields.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    {t('checklists.form.itemsEmpty')}
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
                                <Input
                                  placeholder={t('checklists.form.itemPlaceholder', {
                                    index: index + 1,
                                  })}
                                  {...field}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-9 shrink-0"
                                  onClick={() => remove(index)}
                                >
                                  <X className="size-4" />
                                  <span className="sr-only">{t('checklists.form.itemRemove')}</span>
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
