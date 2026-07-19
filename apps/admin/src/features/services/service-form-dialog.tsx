'use client';

/**
 * 新建/编辑服务弹窗 —— 照抄 features/contacts/contact-form-dialog.tsx 模式,
 * 对齐旧 Fuse 项目(serviceDialog.js / serviceAppSlice.js)的字段语义:
 *  - serviceTypeId(Tiltaksklasse)   单选:1 / 2 / Ingen(None → undefined)
 *  - checklistTempId(检查单模板)     下拉:选项来自 useChecklistTemplates(label=title)
 *  - serviceWorkflowCategory(工作流)  按名称多选:选项来自 useWorkflowCategoryOptions
 *  - serviceChargedAs(计价方式)       单选:1=per enhet / 2=fastpris,并互斥渲染
 *                                       1 → 单一 Rate 输入;2 → 阶梯价表(slabs)
 *  - description                       必填
 *
 * 提交结构对齐后端:
 *  - serviceWorkflowCategory 为 { workflowCategoryId }[](旧 slice 提交形状)。
 *  - serviceChargedAs===1 时发送 rate、slabs 置空;===2 时发送 slabs、rate 省略(互斥)。
 */
import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Check, ChevronsUpDown, Loader2, Plus, Trash2 } from 'lucide-react';

import type { ServiceDto, WorkflowCategoryDto } from '@nks/api-types';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { useWorkflowCategoryOptions } from '../party-types/api';
import { useChecklistTemplates } from '../checklists/api';
import { useCreateService, useUpdateService } from './api';

/** 「不关联」哨兵值(radix Select 不允许空字符串 item)。 */
const NONE = 'none';

/** 校验消息随语言变化,故 schema 在组件内按 t 重建。 */
type ServiceFormValues = {
  name: string;
  description: string;
  serviceTypeId: string;
  checklistTempId: string;
  serviceChargedAs: string;
  rate?: string;
  servicePerSlabList: { rangeFrom?: string; rangeTo?: string; rate?: string }[];
  workflowCategoryIds: number[];
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
  const { data: templates = [] } = useChecklistTemplates();
  const { data: categories = [] } = useWorkflowCategoryOptions();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const serviceSchema = React.useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t('services.validation.nameRequired')),
        description: z.string().trim().min(1, t('services.validation.descriptionRequired')),
        serviceTypeId: z.string(),
        checklistTempId: z.string(),
        serviceChargedAs: z.string(),
        rate: z.string().optional(),
        servicePerSlabList: z.array(
          z.object({
            rangeFrom: z.string().optional(),
            rangeTo: z.string().optional(),
            rate: z.string().optional(),
          }),
        ),
        workflowCategoryIds: z.array(z.number()),
      }),
    [t],
  );

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      serviceTypeId: '1',
      checklistTempId: NONE,
      serviceChargedAs: '1',
      rate: '',
      servicePerSlabList: [],
      workflowCategoryIds: [],
    },
  });

  const slabs = useFieldArray({ control: form.control, name: 'servicePerSlabList' });
  const chargedAs = form.watch('serviceChargedAs');

  // 每次打开时同步表单值(新建清空 / 编辑回填)。
  React.useEffect(() => {
    if (open) {
      form.reset({
        name: service?.name ?? '',
        description: service?.description ?? '',
        // 编辑时若无 serviceTypeId 视为 Ingen;新建默认 Tiltaksklasse 1(旧版默认)。
        serviceTypeId:
          service?.serviceTypeId !== undefined
            ? String(service.serviceTypeId)
            : service
              ? NONE
              : '1',
        checklistTempId:
          service?.checklistTempId !== undefined ? String(service.checklistTempId) : NONE,
        serviceChargedAs: numStr(service?.serviceChargedAs) || '1',
        rate: service?.rate ?? '',
        servicePerSlabList: (service?.servicePerSlabList ?? []).map((s) => ({
          rangeFrom: numStr(s.rangeFrom),
          rangeTo: numStr(s.rangeTo),
          rate: s.rate ?? '',
        })),
        workflowCategoryIds: (service?.serviceWorkflowCategory ?? [])
          .map((c) => c.workflowCategoryId)
          .filter((id): id is number => id !== undefined),
      });
    }
  }, [open, service, form]);

  const onSubmit = form.handleSubmit((values) => {
    const isFixedPrice = values.serviceChargedAs === '2';
    const payload: ServiceDto = {
      ...(service?.id ? { id: service.id } : {}),
      name: values.name,
      description: values.description,
      serviceTypeId: values.serviceTypeId === NONE ? undefined : toNum(values.serviceTypeId),
      checklistTempId:
        values.checklistTempId === NONE ? undefined : toNum(values.checklistTempId),
      serviceChargedAs: toNum(values.serviceChargedAs),
      // per enhet 时用单一 rate;fastpris 时用阶梯价 —— 两者互斥。
      rate: isFixedPrice ? undefined : values.rate || undefined,
      servicePerSlabList: isFixedPrice
        ? values.servicePerSlabList.map((s) => ({
            rangeFrom: toNum(s.rangeFrom),
            rangeTo: toNum(s.rangeTo),
            rate: s.rate || undefined,
          }))
        : [],
      serviceWorkflowCategory: values.workflowCategoryIds.map((workflowCategoryId) => ({
        workflowCategoryId,
      })),
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

            {/* Tiltaksklasse:1 / 2 / Ingen */}
            <FormField
              control={form.control}
              name="serviceTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('services.form.serviceType')}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">{t('services.form.serviceTypeOption1')}</SelectItem>
                      <SelectItem value="2">{t('services.form.serviceTypeOption2')}</SelectItem>
                      <SelectItem value={NONE}>{t('services.form.serviceTypeNone')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 检查单模板 */}
            <FormField
              control={form.control}
              name="checklistTempId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('services.form.checklistTemplate')}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={t('services.form.checklistTemplatePlaceholder')}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>
                        {t('services.form.checklistTemplateNone')}
                      </SelectItem>
                      {templates.map((tpl) => (
                        <SelectItem key={tpl.id} value={String(tpl.id)}>
                          {tpl.title ?? `#${tpl.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 工作流类别:按名称多选 */}
            <FormField
              control={form.control}
              name="workflowCategoryIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('services.form.categoriesLabel')}</FormLabel>
                  <WorkflowCategoryMultiSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={categories}
                    placeholder={t('services.form.categoriesPlaceholder')}
                    searchPlaceholder={t('services.form.categoriesSearch')}
                    emptyText={t('services.form.categoriesNoResults')}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 计价方式:per enhet / fastpris —— 互斥渲染 */}
            <FormField
              control={form.control}
              name="serviceChargedAs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('services.form.chargedAsLabel')}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">{t('services.form.chargedAsPerUnit')}</SelectItem>
                      <SelectItem value="2">{t('services.form.chargedAsFixed')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {chargedAs === '1' ? (
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
            ) : (
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
                            <Input
                              type="number"
                              placeholder={t('services.form.slabFrom')}
                              {...field}
                            />
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
                            <Input
                              type="number"
                              placeholder={t('services.form.slabTo')}
                              {...field}
                            />
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

/** 工作流类别按名称多选 —— Popover + Command,选中项以 Badge 展示。 */
interface WorkflowCategoryMultiSelectProps {
  value: number[];
  onChange: (value: number[]) => void;
  options: WorkflowCategoryDto[];
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
}

function WorkflowCategoryMultiSelect({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
}: WorkflowCategoryMultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const toggle = (id: number) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  const selected = options.filter((o) => o.id !== undefined && value.includes(o.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-auto min-h-9 w-full justify-between font-normal"
        >
          {selected.length > 0 ? (
            <span className="flex flex-wrap gap-1">
              {selected.map((o) => (
                <Badge key={o.id} variant="secondary" className="font-normal">
                  {o.name ?? `#${o.id}`}
                </Badge>
              ))}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.id}
                  value={o.name ?? String(o.id)}
                  onSelect={() => o.id !== undefined && toggle(o.id)}
                >
                  <Check
                    className={cn(
                      'size-4',
                      o.id !== undefined && value.includes(o.id) ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {o.name ?? `#${o.id}`}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
