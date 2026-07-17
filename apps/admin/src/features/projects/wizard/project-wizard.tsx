'use client';

/**
 * 新建/编辑项目向导 —— 自包含三步 stepper(不依赖 Dialog,页面直用或外层套 Dialog 均可)。
 *
 * 三步:
 *  1. ProjectInfo   —— 标题(必填)、地址、gårdsnr/bruksnummer、kommune、postnr/poststed、
 *                       经纬度、beskrivelse、kommentarer。
 *  2. CustomerInfo  —— 客户(customerId)与 kontaktperson(contactPersonId),下拉取自 Contact 列表。
 *  3. Pricing       —— 选服务并定价:serviceId + quantity + price(可多行,来自 Service 列表)。
 *
 * 编辑模式:传入 project(GetProject 结果)。提交时以原始 project 为底,仅覆盖表单编辑过的字段
 * 与 projectService,未展示字段原样回传,避免丢失。
 */
import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2, Plus, Trash2, Check } from 'lucide-react';

import type { ProjectDto, ProjectServiceDto } from '@nks/api-types';

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

import { useContacts } from '@/features/contacts/api';
import { useServices } from '@/features/services/api';

import { useCreateProject, useUpdateProject } from '../api';
import { wizardSchema, stepFields, type WizardValues } from './schema';

const STEP_LABEL_KEYS = [
  'projectWizard.steps.projectInfo',
  'projectWizard.steps.customer',
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

  const { data: contacts = [] } = useContacts();
  const { data: services = [] } = useServices();

  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      title: '',
      address: '',
      gardsNo: '',
      bruksnmmer: '',
      kommune: '',
      postNo: '',
      poststed: '',
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
      title: project.title ?? '',
      address: project.address ?? '',
      gardsNo: project.gardsNo ?? '',
      bruksnmmer: project.bruksnmmer ?? '',
      kommune: project.kommune ?? '',
      postNo: project.postNo ?? '',
      poststed: project.poststed ?? '',
      description: project.description ?? '',
      comments: project.comments ?? '',
      longitude: project.longitude ?? '',
      latitude: project.latitude ?? '',
      customerId: numToStr(project.customerId),
      contactPersonId: numToStr(project.contactPersonId),
      services: (project.projectService ?? []).map((ps) => ({
        serviceId: numToStr(ps.serviceId),
        quantity: numToStr(ps.quantity),
        price: ps.price ?? '',
      })),
    });
    // 仅在 project 变化时回填。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  const goNext = async () => {
    const valid = await form.trigger(stepFields[step] as never);
    if (valid) setStep((s) => Math.min(s + 1, STEP_LABEL_KEYS.length - 1));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = form.handleSubmit((values) => {
    const projectServices: ProjectServiceDto[] = values.services
      .filter((s) => s.serviceId)
      .map((s) => ({
        serviceId: strToNum(s.serviceId),
        quantity: strToNum(s.quantity),
        price: s.price || undefined,
      }));

    // 以原始 project 为底,仅覆盖编辑字段与关联服务,保留未展示字段。
    const payload: ProjectDto = {
      ...(project ?? {}),
      title: values.title,
      address: values.address || undefined,
      gardsNo: values.gardsNo || undefined,
      bruksnmmer: values.bruksnmmer || undefined,
      kommune: values.kommune || undefined,
      postNo: values.postNo || undefined,
      poststed: values.poststed || undefined,
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

        {/* Steg 1 —— Prosjektinfo */}
        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('projectWizard.fields.title')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('projectWizard.fields.titlePlaceholder')} {...field} />
                    </FormControl>
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
            <FormField
              control={form.control}
              name="postNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('projectWizard.fields.postNo')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="poststed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('projectWizard.fields.poststed')}</FormLabel>
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
                name="kommune"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('projectWizard.fields.kommune')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
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

        {/* Steg 2 —— Kunde */}
        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('projectWizard.fields.customer')}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('projectWizard.fields.customerPlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contacts.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name ?? `Kontakt #${c.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactPersonId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('projectWizard.fields.contactPerson')}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('projectWizard.fields.contactPersonPlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contacts.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name ?? `Kontakt #${c.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('projectWizard.fields.servicePlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {services.map((s) => (
                              <SelectItem key={s.id} value={String(s.id)}>
                                {s.name ?? `Tjeneste #${s.id}`}
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
                          <Input type="number" min={0} {...field} />
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
                          <Input placeholder="0" {...field} />
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
                    onClick={() => remove(index)}
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
