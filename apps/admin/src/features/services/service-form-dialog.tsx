'use client';

/**
 * 新建/编辑服务弹窗 —— 照抄 features/contacts/contact-form-dialog.tsx 模式,
 * 额外用 useFieldArray 支持两组可增删子表单:
 *  - servicePerSlabList     阶梯价(rangeFrom / rangeTo / rate)
 *  - serviceWorkflowCategory 关联工作流类别(workflowCategoryId)
 *
 * 关联字段以「基础可编辑」为目标:阶梯价直接编辑数值;工作流类别用数字 ID 输入
 * (若后续需要下拉可接 endpoints.workflowCategory.getAll,与 PartyType 表单同理)。
 * 编辑时保留表单未覆盖的字段(serviceTypeId / checklistTempId)不丢失。
 */
import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Loader2, Plus, Trash2 } from 'lucide-react';

import type { ServiceDto } from '@nks/api-types';

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
import { Textarea } from '@/components/ui/textarea';

import { useCreateService, useUpdateService } from './api';

/** 校验消息随语言变化,故 schema 在组件内按 t 重建。 */
type ServiceFormValues = {
  name: string;
  description?: string;
  rate?: string;
  serviceChargedAs?: string;
  servicePerSlabList: { rangeFrom?: string; rangeTo?: string; rate?: string }[];
  serviceWorkflowCategory: { workflowCategoryId?: string }[];
};

/** number | undefined → 表单字符串。 */
const numStr = (v: number | undefined) => (v === undefined || v === null ? '' : String(v));
/** 表单字符串 → number | undefined(空串或非法转 undefined)。 */
const toNum = (v: string | undefined): number | undefined => {
  if (v === undefined || v.trim() === '') return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
};

export interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 传入即编辑模式;undefined 为新建。 */
  service?: ServiceDto;
}

export function ServiceFormDialog({ open, onOpenChange, service }: ServiceFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(service?.id);
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const serviceSchema = React.useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t('services.validation.nameRequired')),
        description: z.string().optional(),
        rate: z.string().optional(),
        serviceChargedAs: z.string().optional(),
        servicePerSlabList: z.array(
          z.object({
            rangeFrom: z.string().optional(),
            rangeTo: z.string().optional(),
            rate: z.string().optional(),
          }),
        ),
        serviceWorkflowCategory: z.array(
          z.object({ workflowCategoryId: z.string().optional() }),
        ),
      }),
    [t],
  );

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      rate: '',
      serviceChargedAs: '',
      servicePerSlabList: [],
      serviceWorkflowCategory: [],
    },
  });

  const slabs = useFieldArray({ control: form.control, name: 'servicePerSlabList' });
  const categories = useFieldArray({ control: form.control, name: 'serviceWorkflowCategory' });

  // 每次打开时同步表单值(新建清空 / 编辑回填)。
  React.useEffect(() => {
    if (open) {
      form.reset({
        name: service?.name ?? '',
        description: service?.description ?? '',
        rate: service?.rate ?? '',
        serviceChargedAs: numStr(service?.serviceChargedAs),
        servicePerSlabList: (service?.servicePerSlabList ?? []).map((s) => ({
          rangeFrom: numStr(s.rangeFrom),
          rangeTo: numStr(s.rangeTo),
          rate: s.rate ?? '',
        })),
        serviceWorkflowCategory: (service?.serviceWorkflowCategory ?? []).map((c) => ({
          workflowCategoryId: numStr(c.workflowCategoryId),
        })),
      });
    }
  }, [open, service, form]);

  const onSubmit = form.handleSubmit((values) => {
    const payload: ServiceDto = {
      // 保留编辑时表单未覆盖的字段,避免更新时丢失。
      ...(service?.id ? { id: service.id } : {}),
      ...(service?.serviceTypeId !== undefined ? { serviceTypeId: service.serviceTypeId } : {}),
      ...(service?.checklistTempId !== undefined
        ? { checklistTempId: service.checklistTempId }
        : {}),
      name: values.name,
      description: values.description || undefined,
      rate: values.rate || undefined,
      serviceChargedAs: toNum(values.serviceChargedAs),
      servicePerSlabList: values.servicePerSlabList.map((s) => ({
        rangeFrom: toNum(s.rangeFrom),
        rangeTo: toNum(s.rangeTo),
        rate: s.rate || undefined,
      })),
      serviceWorkflowCategory: values.serviceWorkflowCategory
        .map((c) => ({ workflowCategoryId: toNum(c.workflowCategoryId) }))
        .filter((c) => c.workflowCategoryId !== undefined),
    };

    const mutation = isEdit ? updateMutation : createMutation;
    mutation.mutate(payload, {
      onSuccess: () => onOpenChange(false),
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('services.form.editTitle') : t('services.form.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t('services.form.editDescription') : t('services.form.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('services.form.name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('services.form.namePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('services.form.description')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t('services.form.descriptionPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('services.form.rate')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('services.form.ratePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serviceChargedAs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('services.form.chargedAs')}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 阶梯价子表单 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel>{t('services.form.slabsLabel')}</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => slabs.append({ rangeFrom: '', rangeTo: '', rate: '' })}
                >
                  <Plus className="size-4" />
                  {t('common.add')}
                </Button>
              </div>
              {slabs.fields.length === 0 && (
                <p className="text-muted-foreground text-sm">{t('services.form.slabsEmpty')}</p>
              )}
              {slabs.fields.map((row, index) => (
                <div key={row.id} className="flex items-end gap-2">
                  <FormField
                    control={form.control}
                    name={`servicePerSlabList.${index}.rangeFrom`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input type="number" placeholder={t('services.form.slabFrom')} {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`servicePerSlabList.${index}.rangeTo`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input type="number" placeholder={t('services.form.slabTo')} {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`servicePerSlabList.${index}.rate`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder={t('services.form.slabRate')} {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9 shrink-0"
                    onClick={() => slabs.remove(index)}
                    aria-label={t('services.form.slabRemove')}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* 工作流类别关联子表单 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel>{t('services.form.categoriesLabel')}</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => categories.append({ workflowCategoryId: '' })}
                >
                  <Plus className="size-4" />
                  {t('common.add')}
                </Button>
              </div>
              {categories.fields.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  {t('services.form.categoriesEmpty')}
                </p>
              )}
              {categories.fields.map((row, index) => (
                <div key={row.id} className="flex items-end gap-2">
                  <FormField
                    control={form.control}
                    name={`serviceWorkflowCategory.${index}.workflowCategoryId`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={t('services.form.categoryIdPlaceholder')}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9 shrink-0"
                    onClick={() => categories.remove(index)}
                    aria-label={t('services.form.categoryRemove')}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>

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
