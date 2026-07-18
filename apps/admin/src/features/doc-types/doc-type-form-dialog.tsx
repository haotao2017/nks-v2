'use client';

/**
 * 新建/编辑文档类型弹窗 —— 照抄 features/contacts/contact-form-dialog.tsx。
 *
 * 字段:
 *  - docName    必填文本
 *  - isRequired 开关(Switch)
 *  - partyTypeId 关联第三方类型的外键。理想是下拉选择,但为避免额外拉取
 *    partyType 列表带来的耦合(任务允许),这里先用数字输入并注明;
 *    后续可替换为 <Select> + usePartyTypes()。
 */
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import type { DocType } from '@nks/api-types';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { usePartyTypes } from '@/features/party-types/api';

import { useCreateDocType, useUpdateDocType } from './api';

/** 校验消息随语言变化,故 schema 在组件内按 t 重建。 */
type DocTypeFormValues = {
  docName: string;
  isRequired: boolean;
  partyTypeId?: string;
};

export interface DocTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 传入即编辑模式;undefined 为新建。 */
  docType?: DocType;
}

export function DocTypeFormDialog({ open, onOpenChange, docType }: DocTypeFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(docType?.id);
  const createMutation = useCreateDocType();
  const updateMutation = useUpdateDocType();
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Ansvarsområde 下拉数据源(party type),与原系统一致(选项 label=name、value=id)。
  const { data: partyTypes = [] } = usePartyTypes();

  const docTypeSchema = React.useMemo(
    () =>
      z.object({
        docName: z.string().trim().min(1, t('docTypes.validation.nameRequired')),
        isRequired: z.boolean(),
        // partyTypeId(Ansvarsområde):下拉选中的 party type id(字符串),可选。
        partyTypeId: z.string().optional(),
      }),
    [t],
  );

  const form = useForm<DocTypeFormValues>({
    resolver: zodResolver(docTypeSchema),
    defaultValues: { docName: '', isRequired: false, partyTypeId: '' },
  });

  // 每次打开时同步表单值(新建清空 / 编辑回填)。
  React.useEffect(() => {
    if (open) {
      form.reset({
        docName: docType?.docName ?? '',
        isRequired: docType?.isRequired ?? false,
        partyTypeId:
          docType?.partyTypeId !== undefined && docType?.partyTypeId !== null
            ? String(docType.partyTypeId)
            : '',
      });
    }
  }, [open, docType, form]);

  const onSubmit = form.handleSubmit((values) => {
    const payload: DocType = {
      ...(docType?.id ? { id: docType.id } : {}),
      docName: values.docName,
      isRequired: values.isRequired,
      partyTypeId: values.partyTypeId ? Number(values.partyTypeId) : undefined,
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
            {isEdit ? t('docTypes.form.editTitle') : t('docTypes.form.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t('docTypes.form.editDescription') : t('docTypes.form.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="docName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('docTypes.form.name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('docTypes.form.namePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isRequired"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t('docTypes.form.required')}</FormLabel>
                    <FormDescription>{t('docTypes.form.requiredDescription')}</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="partyTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('docTypes.form.partyType')}</FormLabel>
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('docTypes.form.partyTypePlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {partyTypes.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
