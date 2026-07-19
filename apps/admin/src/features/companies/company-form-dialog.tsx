'use client';

/**
 * 新建/编辑公司弹窗 —— 超级管理面板专用(需 SystemOwner)。
 *
 * - 新建:AddNewCompanyProfile,body 根键 companyProfile。
 * - 编辑:UpdateProfile(带 id);打开时用 GetProfile 拉取该公司完整资料回填。
 * - 字段对齐 CompanyProfile 契约:基础信息 + postCode / postSted(只读,邮编查找) +
 *   telephone / mobile / nameOnEmailAddress / senderEmailAddress +
 *   SMTP(compEmail*) + isActive 开关(编辑可启停)。
 */
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import type { TFunction } from 'i18next';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import type { CompanyProfile, PostCodeDto } from '@nks/api-types';

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

import { usePostCodes } from '@/features/misc/api';

import { useAddCompany, useUpdateCompany, useCompanyProfileDetail } from './api';

const makeCompanySchema = (t: TFunction) =>
  z.object({
    companyName: z.string().trim().min(1, t('companies.validation.companyNameRequired')),
    organizationalNumber: z.string().optional(),
    ownerName: z.string().optional(),
    address: z.string().optional(),
    emailAddress: z.string().optional(),
    postCode: z
      .string()
      .optional()
      .refine((v) => !v || /^\d+$/.test(v.trim()), t('companies.validation.postCodeNumber')),
    postSted: z.string().optional(),
    telephone: z.string().optional(),
    mobile: z.string().optional(),
    nameOnEmailAddress: z.string().optional(),
    senderEmailAddress: z.string().optional(),
    compEmailHost: z.string().optional(),
    compEmailPort: z.string().optional(),
    compEmailUserName: z.string().optional(),
    compEmailPassword: z.string().optional(),
    compEmailDisplayName: z.string().optional(),
    isActive: z.boolean(),
  });

type CompanyFormValues = z.infer<ReturnType<typeof makeCompanySchema>>;

const EMPTY_VALUES: CompanyFormValues = {
  companyName: '',
  organizationalNumber: '',
  ownerName: '',
  address: '',
  emailAddress: '',
  postCode: '',
  postSted: '',
  telephone: '',
  mobile: '',
  nameOnEmailAddress: '',
  senderEmailAddress: '',
  compEmailHost: '',
  compEmailPort: '',
  compEmailUserName: '',
  compEmailPassword: '',
  compEmailDisplayName: '',
  isActive: true,
};

function toFormValues(profile: CompanyProfile, postCodes: PostCodeDto[]): CompanyFormValues {
  const code = profile.postCode != null ? String(profile.postCode) : '';
  const found =
    code.length === 4 ? postCodes.find((p) => p.postnummer === code) : undefined;
  return {
    companyName: profile.companyName ?? '',
    organizationalNumber: profile.organizationalNumber ?? '',
    ownerName: profile.ownerName ?? '',
    address: profile.address ?? '',
    emailAddress: profile.emailAddress ?? '',
    postCode: code,
    postSted: found?.poststed ?? '',
    telephone: profile.telephone ?? '',
    mobile: profile.mobile ?? '',
    nameOnEmailAddress: profile.nameOnEmailAddress ?? '',
    senderEmailAddress: profile.senderEmailAddress ?? '',
    compEmailHost: profile.compEmailHost ?? '',
    compEmailPort: profile.compEmailPort ?? '',
    compEmailUserName: profile.compEmailUserName ?? '',
    compEmailPassword: profile.compEmailPassword ?? '',
    compEmailDisplayName: profile.compEmailDisplayName ?? '',
    isActive: profile.isActive ?? true,
  };
}

export interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 传入即编辑模式;undefined 为新建。 */
  company?: CompanyProfile;
}

export function CompanyFormDialog({ open, onOpenChange, company }: CompanyFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(company?.id);
  const addMutation = useAddCompany();
  const updateMutation = useUpdateCompany(company?.id);
  const isPending = addMutation.isPending || updateMutation.isPending;
  const { data: postCodes = [] } = usePostCodes();

  // 编辑时拉取完整资料回填(GetAllProfiles 可能为精简投影)。
  const { data: detail } = useCompanyProfileDetail(company?.id, isEdit && open);

  const companySchema = React.useMemo(() => makeCompanySchema(t), [t]);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: EMPTY_VALUES,
  });

  const watchedPostCode = form.watch('postCode');

  /** 邮编 4 位时本地匹配回填 postSted(后端 CompanyProfile 无独立 postSted 字段,仅展示)。 */
  React.useEffect(() => {
    const code = (watchedPostCode ?? '').trim();
    if (code.length !== 4 || postCodes.length === 0) return;
    const found = postCodes.find((p) => p.postnummer === code);
    form.setValue('postSted', found?.poststed ?? '', { shouldValidate: false });
  }, [watchedPostCode, postCodes, form]);

  React.useEffect(() => {
    if (!open) return;
    if (isEdit) {
      // 优先用刚拉到的 detail;未到达前先用传入的行数据。
      form.reset(toFormValues(detail ?? company ?? {}, postCodes));
    } else {
      form.reset(EMPTY_VALUES);
    }
  }, [open, isEdit, company, detail, form, postCodes]);

  const onSubmit = form.handleSubmit((values) => {
    // 编辑时合并已拉取的完整档案,避免未展示的字段被 null 覆盖。
    const base = isEdit ? { ...(detail ?? company ?? {}) } : {};
    const payload: CompanyProfile = {
      ...base,
      ...(isEdit && company?.id ? { id: company.id } : {}),
      companyName: values.companyName,
      organizationalNumber: values.organizationalNumber || undefined,
      ownerName: values.ownerName || undefined,
      address: values.address || undefined,
      emailAddress: values.emailAddress || undefined,
      postCode: values.postCode ? Number(values.postCode) : undefined,
      telephone: values.telephone || undefined,
      mobile: values.mobile || undefined,
      nameOnEmailAddress: values.nameOnEmailAddress || undefined,
      senderEmailAddress: values.senderEmailAddress || undefined,
      compEmailHost: values.compEmailHost || undefined,
      compEmailPort: values.compEmailPort || undefined,
      compEmailUserName: values.compEmailUserName || undefined,
      compEmailPassword: values.compEmailPassword || undefined,
      compEmailDisplayName: values.compEmailDisplayName || undefined,
      isActive: values.isActive,
    };

    const mutation = isEdit ? updateMutation : addMutation;
    mutation.mutate(payload, { onSuccess: () => onOpenChange(false) });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('companies.dialog.editTitle') : t('companies.dialog.title')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t('companies.dialog.editDesc') : t('companies.dialog.desc')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('companies.dialog.companyName')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="organizationalNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('companies.dialog.orgNumber')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ownerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('companies.dialog.owner')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('companies.dialog.address')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="postCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('companies.dialog.postCode')}</FormLabel>
                  <FormControl>
                    <Input inputMode="numeric" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="postSted"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('companies.dialog.postSted')}</FormLabel>
                  <FormControl>
                    <Input {...field} disabled readOnly />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="telephone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('companies.dialog.telephone')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('companies.dialog.mobile')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emailAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('companies.dialog.email')}</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nameOnEmailAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('companies.dialog.nameOnEmail')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="senderEmailAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('companies.dialog.senderEmail')}</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="compEmailDisplayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('companies.dialog.smtpDisplayName')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="compEmailHost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('companies.dialog.smtpHost')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="compEmailPort"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('companies.dialog.smtpPort')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="compEmailUserName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('companies.dialog.smtpUserName')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="compEmailPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('companies.dialog.smtpPassword')}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t('companies.dialog.active')}</FormLabel>
                    <FormDescription>{t('companies.dialog.activeHint')}</FormDescription>
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
