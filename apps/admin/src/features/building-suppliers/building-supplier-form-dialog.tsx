'use client';

/**
 * 新建/编辑建材供应商弹窗 —— 照抄 features/contacts/contact-form-dialog.tsx。
 *
 * 字段:
 *  - title     必填文本
 *  - sortOrder 排序序号(可选数字)。注意:实体上 sortOrder 标注 @JsonIgnore,
 *    线上响应不含它、契约类型也没有它;此处仍随请求体发送(见 api.ts 说明),
 *    编辑回填时无法从响应取到,故编辑模式下默认空。
 */
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import type { BuildingSupplierDto } from '@nks/api-types';

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

import {
  useCreateBuildingSupplier,
  useUpdateBuildingSupplier,
  type BuildingSupplierPayload,
} from './api';

/** 校验消息随语言变化,故 schema 在组件内按 t 重建。 */
type BuildingSupplierFormValues = {
  title: string;
  sortOrder?: string;
};

export interface BuildingSupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 传入即编辑模式;undefined 为新建。 */
  buildingSupplier?: BuildingSupplierDto;
}

export function BuildingSupplierFormDialog({
  open,
  onOpenChange,
  buildingSupplier,
}: BuildingSupplierFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(buildingSupplier?.id);
  const createMutation = useCreateBuildingSupplier();
  const updateMutation = useUpdateBuildingSupplier();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const buildingSupplierSchema = React.useMemo(
    () =>
      z.object({
        title: z.string().trim().min(1, t('buildingSuppliers.validation.nameRequired')),
        sortOrder: z
          .string()
          .optional()
          .refine(
            (v) => !v || /^\d+$/.test(v.trim()),
            t('buildingSuppliers.validation.sortOrderNumber'),
          ),
      }),
    [t],
  );

  const form = useForm<BuildingSupplierFormValues>({
    resolver: zodResolver(buildingSupplierSchema),
    defaultValues: { title: '', sortOrder: '' },
  });

  // 每次打开时同步表单值(新建清空 / 编辑回填)。
  // sortOrder 线上不返回,编辑模式下无法回填,保持空。
  React.useEffect(() => {
    if (open) {
      form.reset({
        title: buildingSupplier?.title ?? '',
        sortOrder: '',
      });
    }
  }, [open, buildingSupplier, form]);

  const onSubmit = form.handleSubmit((values) => {
    const payload: BuildingSupplierPayload = {
      ...(buildingSupplier?.id ? { id: buildingSupplier.id } : {}),
      title: values.title,
      sortOrder: values.sortOrder ? Number(values.sortOrder) : undefined,
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
              ? t('buildingSuppliers.form.editTitle')
              : t('buildingSuppliers.form.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t('buildingSuppliers.form.editDescription')
              : t('buildingSuppliers.form.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('buildingSuppliers.form.name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('buildingSuppliers.form.namePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sortOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('buildingSuppliers.form.sortOrder')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder={t('buildingSuppliers.form.sortOrderPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('buildingSuppliers.form.sortOrderDescription')}
                  </FormDescription>
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
