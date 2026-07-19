'use client';

/**
 * 新建/编辑公司弹窗 —— 超级管理面板专用(需 SystemOwner)。
 *
 * - 新建:AddNewCompanyProfile,body 根键 companyProfile。
 * - 编辑:UpdateProfile(带 id);打开时用 GetProfile 拉取该公司完整资料回填。
 * - 字段对齐 CompanyProfile 契约:基础信息 + postCode / telephone / mobile /
 *   nameOnEmailAddress / senderEmailAddress(均可选)+ isActive 开关(编辑可启停)。
 */
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import type { TFunction } from 'i18next';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import type { CompanyProfile } from '@nks/api-types';

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
    telephone: z.string().optional(),
    mobile: z.string().optional(),
    nameOnEmailAddress: z.string().optional(),
    senderEmailAddress: z.string().optional(),
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
  telephone: '',
  mobile: '',
  nameOnEmailAddress: '',
  senderEmailAddress: '',
  isActive: true,
};

function toFormValues(profile: CompanyProfile): CompanyFormValues {
  return {
    companyName: profile.companyName ?? '',
    organizationalNumber: profile.organizationalNumber ?? '',
    ownerName: profile.ownerName ?? '',
    address: profile.address ?? '',
    emailAddress: profile.emailAddress ?? '',
    postCode: profile.postCode != null ? String(profile.postCode) : '',
    telephone: profile.telephone ?? '',
    mobile: profile.mobile ?? '',
    nameOnEmailAddress: profile.nameOnEmailAddress ?? '',
    senderEmailAddress: profile.senderEmailAddress ?? '',
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

  // 编辑时拉取完整资料回填(GetAllProfiles 可能为精简投影)。
  const { data: detail } = useCompanyProfileDetail(company?.id, isEdit && open);

  const companySchema = React.useMemo(() => makeCompanySchema(t), [t]);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: EMPTY_VALUES,
  });

  React.useEffect(() => {
    if (!open) return;
    if (isEdit) {
      // 优先用刚拉到的 detail;未到达前先用传入的行数据。
      form.reset(toFormValues(detail ?? company ?? {}));
    } else {
      form.reset(EMPTY_VALUES);
    }
  }, [open, isEdit, company, detail, form]);

  const onSubmit = form.handleSubmit((values) => {
    const payload: CompanyProfile = {
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
      isActive: values.isActive,
    };

    const mutation = isEdit ? updateMutation : addMutation;
    mutation.mutate(payload, { onSuccess: () => onOpenChange(false) });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
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
