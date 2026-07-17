'use client';

/**
 * 新建/编辑项目向导 —— 自包含三步 stepper(不依赖 Dialog,页面直用或外层套 Dialog 均可)。
 *
 * 三步(顺序对齐旧系统 projectConfig 的 tab 顺序:Contact → Project → Services):
 *  1. Kontaktinfo   —— 客户(customerId)与 kontaktperson(contactPersonId),下拉取自 Contact 列表。
 *  2. Prosjektinfo  —— Husleverandør(buildingSupplierId,下拉+加号新建)、地址、gårdsnr/bruksnummer、
 *                       postnr(邮编联动回填 poststed/kommune)、beskrivelse、经纬度、kommentarer。
 *  3. Priser        —— 选服务并定价:serviceId + quantity + price(可多行,来自 Service 列表)。
 *
 * 与旧系统对齐要点:
 *  - 旧系统 ProjectInfo.js 无 title 输入框;ProjectHeader.js 的必填 keyArray 不含 title,
 *    CreatProject 直接把表单值(title 默认空串)透传后端。故本向导不设 title 输入,
 *    提交时用 address 作为可读标题派生(新建),编辑保留原 title —— 不自造必填 title。
 *  - Husleverandør / postnr 联动 / 计价 / 删除服务,均 1:1 复刻旧系统 ProjectInfo.js + PricingTab.js。
 *
 * 编辑模式:传入 project(GetProject 结果)。提交时以原始 project 为底,仅覆盖表单编辑过的字段
 * 与 projectService,未展示字段原样回传,避免丢失。
 */
import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2, Plus, Trash2, Check } from 'lucide-react';

import type { ProjectDto, ProjectServiceDto, ServiceDto } from '@nks/api-types';

import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

import { useServices } from '@/features/services/api';
import { usePostCodes } from '@/features/misc/api';

import { useCreateProject, useUpdateProject, useDeleteProjectService } from '../api';
import { makeWizardSchema, stepFields, type WizardValues } from './schema';
import { ContactSelect } from './contact-select';
import { BuildingSupplierSelect } from './building-supplier-select';

const STEP_LABEL_KEYS = [
  'projectWizard.steps.contactInfo',
  'projectWizard.steps.projectInfo',
  'projectWizard.steps.pricing',
];

/** 数字 → 表单 string(undefined/null → '')。 */
const numToStr = (v?: number) => (typeof v === 'number' ? String(v) : '');
/** 表单 string → number | undefined。 */
const strToNum = (v?: string) => {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/**
 * 计价 —— 对齐旧系统 PricingTab.js:
 *  - serviceChargedAs===2(阶梯):按当前 quantity 落入 servicePerSlabList 的 [rangeFrom, rangeTo] 区间取 slab.rate。
 *  - 否则:price = quantity × service.rate。
 * rate 为 String,做数值换算后回写 string。找不到区间/无 rate 时回退空串。
 */
function computePrice(service: ServiceDto | undefined, quantityStr: string): string {
  if (!service) return '';
  const q = Number(quantityStr);
  const qty = Number.isFinite(q) ? q : 0;
  if (service.serviceChargedAs === 2) {
    const slab = (service.servicePerSlabList ?? []).find(
      (s) => (s.rangeFrom ?? 0) <= qty && (s.rangeTo ?? 0) >= qty,
    );
    return slab?.rate ?? '';
  }
  const rate = Number(service.rate);
  const unit = Number.isFinite(rate) ? rate : 0;
  return String(unit * qty);
}

export interface ProjectWizardProps {
  /** 传入即编辑模式;否则新建。 */
  project?: ProjectDto;
  /** 提交成功回调(页面用于跳转,Dialog 用于关闭)。参数为返回的项目。 */
  onDone?: (project?: ProjectDto) => void;
  /** 取消回调。 */
  onCancel?: () => void;
}

export function ProjectWizard({ project, onDone, onCancel }: ProjectWizardProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(project?.id);
  const [step, setStep] = React.useState(0);

  const { data: services = [] } = useServices();
  const { data: postCodes = [] } = usePostCodes();

  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteServiceMutation = useDeleteProjectService();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const wizardSchema = React.useMemo(() => makeWizardSchema(t), [t]);

  const form = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      address: '',
      gardsNo: '',
      bruksnmmer: '',
      kommune: '',
      postNo: '',
      poststed: '',
      buildingSupplierId: '',
      description: '',
      comments: '',
      longitude: '',
      latitude: '',
      customerId: '',
      contactPersonId: '',
      services: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'services',
  });

  // 编辑模式回填一次。
  React.useEffect(() => {
    if (!project) return;
    form.reset({
      address: project.address ?? '',
      gardsNo: project.gardsNo ?? '',
      bruksnmmer: project.bruksnmmer ?? '',
      kommune: project.kommune ?? '',
      postNo: project.postNo ?? '',
      poststed: project.poststed ?? '',
      buildingSupplierId: numToStr(project.buildingSupplierId),
      description: project.description ?? '',
      comments: project.comments ?? '',
      longitude: project.longitude ?? '',
      latitude: project.latitude ?? '',
      customerId: numToStr(project.customerId),
      contactPersonId: numToStr(project.contactPersonId),
      services: (project.projectService ?? []).map((ps) => ({
        id: numToStr(ps.id),
        serviceId: numToStr(ps.serviceId),
        quantity: numToStr(ps.quantity),
        price: ps.price ?? '',
      })),
    });
    // 仅在 project 变化时回填。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  /** postnr 变化 → 4 位时本地匹配邮编,回填 poststed / kommune(旧系统 findPostcodeInfo)。 */
  const handlePostNoChange = (value: string) => {
    form.setValue('postNo', value, { shouldValidate: true });
    if (/^\d{4}$/.test(value)) {
      const found = postCodes.find((p) => p.postnummer === value);
      if (found) {
        form.setValue('poststed', found.poststed ?? '', { shouldValidate: true });
        form.setValue('kommune', found.kommunenavn ?? '', { shouldValidate: true });
      }
    }
  };

  /** 选服务 → 写回 serviceId,数量置 1,并算初始价(旧系统 selectService)。 */
  const handleServiceSelect = (index: number, serviceIdStr: string) => {
    form.setValue(`services.${index}.serviceId`, serviceIdStr, { shouldValidate: true });
    const service = services.find((s) => String(s.id) === serviceIdStr);
    const qty = '1';
    form.setValue(`services.${index}.quantity`, qty);
    form.setValue(`services.${index}.price`, computePrice(service, qty));
  };

  /** 数量变化 → 重算价(旧系统 handleQuantityChange)。 */
  const handleQuantityChange = (index: number, value: string) => {
    form.setValue(`services.${index}.quantity`, value);
    const serviceId = form.getValues(`services.${index}.serviceId`);
    const service = services.find((s) => String(s.id) === serviceId);
    form.setValue(`services.${index}.price`, computePrice(service, value));
  };

  /** 删除某服务行:编辑模式且该行已存在(有 id)→ 调 DeleteProjectService;之后从表单移除。 */
  const handleRemoveService = (index: number) => {
    const row = form.getValues(`services.${index}`);
    if (isEdit && project?.id && row?.id) {
      deleteServiceMutation.mutate({ projectId: project.id, projectServiceId: Number(row.id) });
    }
    remove(index);
  };

  const goNext = async () => {
    const valid = await form.trigger(stepFields[step] as never);
    if (valid) setStep((s) => Math.min(s + 1, STEP_LABEL_KEYS.length - 1));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = form.handleSubmit((values) => {
    const projectServices: ProjectServiceDto[] = values.services
      .filter((s) => s.serviceId)
      .map((s) => ({
        ...(s.id ? { id: Number(s.id) } : {}),
        serviceId: strToNum(s.serviceId),
        quantity: strToNum(s.quantity),
        price: s.price || undefined,
      }));

    // 以原始 project 为底,仅覆盖编辑字段与关联服务,保留未展示字段。
    // title:旧系统无输入,新建时用 address 派生一个可读标题,编辑保留原 title。
    const payload: ProjectDto = {
      ...(project ?? {}),
      title: project?.title || values.address || undefined,
      address: values.address || undefined,
      gardsNo: values.gardsNo || undefined,
      bruksnmmer: values.bruksnmmer || undefined,
      kommune: values.kommune || undefined,
      postNo: values.postNo || undefined,
      poststed: values.poststed || undefined,
      buildingSupplierId: strToNum(values.buildingSupplierId),
      description: values.description || undefined,
      comments: values.comments || undefined,
      longitude: values.longitude || undefined,
      latitude: values.latitude || undefined,
      customerId: strToNum(values.customerId),
      contactPersonId: strToNum(values.contactPersonId),
      projectService: projectServices,
    };

    const mutation = isEdit ? updateMutation : createMutation;
    mutation.mutate(payload, { onSuccess: (data) => onDone?.(data) });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Stepper 指示器 */}
        <ol className="flex items-center gap-2">
          {STEP_LABEL_KEYS.map((labelKey, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <li key={labelKey} className="flex flex-1 items-center gap-2">
                <div
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                    current && 'border-primary bg-primary text-primary-foreground',
                    done && 'border-primary bg-primary/10 text-primary',
                    !current && !done && 'text-muted-foreground',
                  )}
                >
                  {done ? <Check className="size-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    'text-sm',
                    current ? 'text-foreground font-medium' : 'text-muted-foreground',
                  )}
                >
                  {t(labelKey)}
                </span>
                {i < STEP_LABEL_KEYS.length - 1 && <div className="bg-border h-px flex-1" />}
              </li>
            );
          })}
        </ol>

        {/* Steg 1 —— Kontaktinfo (Kunde / Ansvarlig søker) */}
        {step === 0 && (
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-medium">
                {t('projectWizard.fields.customer')}
              </h3>
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <ContactSelect value={field.value ?? ''} onChange={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-medium">
                {t('projectWizard.fields.responsibleApplicant')}
              </h3>
              <FormField
                control={form.control}
                name="contactPersonId"
                render={({ field }) => (
                  <FormItem>
                    <ContactSelect value={field.value ?? ''} onChange={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* Steg 2 —— Prosjektinfo */}
        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Husleverandør —— 下拉 + 加号新建 */}
            <div className="sm:col-span-2">
              <FormField
                control={form.control}
                name="buildingSupplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('projectWizard.fields.buildingSupplier')}</FormLabel>
                    <BuildingSupplierSelect value={field.value ?? ''} onChange={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="sm:col-span-2">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('projectWizard.fields.address')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('projectWizard.fields.addressPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="gardsNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('projectWizard.fields.gardsNo')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bruksnmmer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('projectWizard.fields.bruksnummer')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* postnr:4 位时联动回填 poststed / kommune */}
            <FormField
              control={form.control}
              name="postNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('projectWizard.fields.postNo')}</FormLabel>
                  <FormControl>
                    <Input
                      value={field.value ?? ''}
                      onChange={(e) => handlePostNoChange(e.target.value)}
                      inputMode="numeric"
                      maxLength={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* poststed:只读,由邮编联动回填(对齐旧系统 disabled 字段) */}
            <FormField
              control={form.control}
              name="poststed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('projectWizard.fields.poststed')}</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* kommune:只读,由邮编联动回填 */}
            <div className="sm:col-span-2">
              <FormField
                control={form.control}
                name="kommune"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('projectWizard.fields.kommune')}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="latitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('projectWizard.fields.latitude')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="longitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('projectWizard.fields.longitude')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="sm:col-span-2">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('projectWizard.fields.description')}</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="sm:col-span-2">
              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('projectWizard.fields.comments')}</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* Steg 3 —— Priser */}
        {step === 2 && (
          <div className="space-y-4">
            {fields.length === 0 && (
              <p className="text-muted-foreground text-sm">{t('projectWizard.noServices')}</p>
            )}
            {fields.map((row, index) => (
              <div key={row.id} className="grid grid-cols-12 items-end gap-2">
                <div className="col-span-6">
                  <FormField
                    control={form.control}
                    name={`services.${index}.serviceId`}
                    render={({ field }) => (
                      <FormItem>
                        {index === 0 && <FormLabel>{t('projectWizard.fields.service')}</FormLabel>}
                        <Select
                          value={field.value}
                          onValueChange={(v) => handleServiceSelect(index, v)}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('projectWizard.fields.servicePlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {services.map((s) => (
                              <SelectItem key={s.id} value={String(s.id)}>
                                {s.description ? `${s.name} (${s.description})` : (s.name ?? `#${s.id}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name={`services.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        {index === 0 && <FormLabel>{t('projectWizard.fields.quantity')}</FormLabel>}
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            value={field.value ?? ''}
                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-3">
                  <FormField
                    control={form.control}
                    name={`services.${index}.price`}
                    render={({ field }) => (
                      <FormItem>
                        {index === 0 && <FormLabel>{t('projectWizard.fields.price')}</FormLabel>}
                        <FormControl>
                          <div className="relative">
                            <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                              {t('projectWizard.currency')}
                            </span>
                            <Input className="pl-8" placeholder="0" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveService(index)}
                    aria-label={t('projectWizard.removeService')}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ serviceId: '', quantity: '', price: '' })}
            >
              <Plus className="size-4" />
              {t('projectWizard.addService')}
            </Button>
          </div>
        )}

        {/* Fotknapper */}
        <div className="flex items-center justify-between border-t pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isPending}
          >
            {t('projectWizard.cancel')}
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button type="button" variant="outline" onClick={goBack} disabled={isPending}>
                {t('projectWizard.back')}
              </Button>
            )}
            {step < STEP_LABEL_KEYS.length - 1 ? (
              <Button type="button" onClick={goNext}>
                {t('projectWizard.next')}
              </Button>
            ) : (
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? t('projectWizard.save') : t('projectWizard.create')}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}
