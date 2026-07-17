'use client';

/**
 * Selskap —— 当前公司资料 + 每公司 SMTP 设置 + 公司文件夹(基础展示/编辑)。
 *
 * - 公司资料:GetProfile?CompanyID=<useAuth().companyID> → UpdateProfile。
 *   提交时以已加载 CompanyProfile 为底,覆盖表单字段并带回 id。
 * - SMTP:compEmail* 字段(每公司独立发件配置)。
 * - 公司文件夹:GetSingleCompanyFolder / UpdateSingleCompanyFolder。
 *   注意后端要求 SystemOwner,普通管理员会 403 —— 此时只显示提示,不渲染编辑区。
 */
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import type { TFunction } from 'i18next';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import type { CompanyProfile, DocFolders } from '@nks/api-types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';

import {
  useCompanyProfile,
  useUpdateCompanyProfile,
  useCompanyFolder,
  useUpdateCompanyFolder,
} from './api';

/* -------------------------------------------------------------------------- */
/* 公司资料表单                                                               */
/* -------------------------------------------------------------------------- */

const makeCompanySchema = (t: TFunction) =>
  z.object({
  companyName: z.string().trim().min(1, t('team.company.validation.companyNameRequired')),
  organizationalNumber: z.string().optional(),
  address: z.string().optional(),
  ownerName: z.string().optional(),
  postCode: z.string().optional(),
  telephone: z.string().optional(),
  mobile: z.string().optional(),
  emailAddress: z.string().optional(),
  nameOnEmailAddress: z.string().optional(),
  senderEmailAddress: z.string().optional(),
  compEmailHost: z.string().optional(),
  compEmailPort: z.string().optional(),
  compEmailUserName: z.string().optional(),
  compEmailPassword: z.string().optional(),
  compEmailDisplayName: z.string().optional(),
  });

type CompanyFormValues = z.infer<ReturnType<typeof makeCompanySchema>>;

function CompanyProfileForm({ companyId }: { companyId?: number }) {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useCompanyProfile(companyId);
  const updateMutation = useUpdateCompanyProfile(companyId);

  const companySchema = React.useMemo(() => makeCompanySchema(t), [t]);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: '',
      organizationalNumber: '',
      address: '',
      ownerName: '',
      postCode: '',
      telephone: '',
      mobile: '',
      emailAddress: '',
      nameOnEmailAddress: '',
      senderEmailAddress: '',
      compEmailHost: '',
      compEmailPort: '',
      compEmailUserName: '',
      compEmailPassword: '',
      compEmailDisplayName: '',
    },
  });

  React.useEffect(() => {
    if (profile) {
      form.reset({
        companyName: profile.companyName ?? '',
        organizationalNumber: profile.organizationalNumber ?? '',
        address: profile.address ?? '',
        ownerName: profile.ownerName ?? '',
        postCode: profile.postCode != null ? String(profile.postCode) : '',
        telephone: profile.telephone ?? '',
        mobile: profile.mobile ?? '',
        emailAddress: profile.emailAddress ?? '',
        nameOnEmailAddress: profile.nameOnEmailAddress ?? '',
        senderEmailAddress: profile.senderEmailAddress ?? '',
        compEmailHost: profile.compEmailHost ?? '',
        compEmailPort: profile.compEmailPort ?? '',
        compEmailUserName: profile.compEmailUserName ?? '',
        compEmailPassword: profile.compEmailPassword ?? '',
        compEmailDisplayName: profile.compEmailDisplayName ?? '',
      });
    }
  }, [profile, form]);

  const onSubmit = form.handleSubmit((values) => {
    if (!profile) return;
    const trimmedPost = values.postCode?.trim();
    const payload: CompanyProfile = {
      ...profile,
      companyName: values.companyName,
      organizationalNumber: values.organizationalNumber || undefined,
      address: values.address || undefined,
      ownerName: values.ownerName || undefined,
      postCode: trimmedPost ? Number(trimmedPost) : undefined,
      telephone: values.telephone || undefined,
      mobile: values.mobile || undefined,
      emailAddress: values.emailAddress || undefined,
      nameOnEmailAddress: values.nameOnEmailAddress || undefined,
      senderEmailAddress: values.senderEmailAddress || undefined,
      compEmailHost: values.compEmailHost || undefined,
      compEmailPort: values.compEmailPort || undefined,
      compEmailUserName: values.compEmailUserName || undefined,
      compEmailPassword: values.compEmailPassword || undefined,
      compEmailDisplayName: values.compEmailDisplayName || undefined,
    };
    updateMutation.mutate(payload);
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const textField = (name: keyof CompanyFormValues, label: string, type = 'text') => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type={type} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('team.company.infoTitle')}</CardTitle>
            <CardDescription>{t('team.company.infoDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {textField('companyName', t('team.company.fields.companyName'))}
            {textField('organizationalNumber', t('team.company.fields.orgNumber'))}
            {textField('ownerName', t('team.company.fields.owner'))}
            {textField('postCode', t('team.company.fields.postCode'))}
            <div className="sm:col-span-2">
              {textField('address', t('team.company.fields.address'))}
            </div>
            {textField('telephone', t('team.company.fields.telephone'))}
            {textField('mobile', t('team.company.fields.mobile'))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('team.company.emailTitle')}</CardTitle>
            <CardDescription>{t('team.company.emailDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {textField('emailAddress', t('team.company.emailFields.emailAddress'), 'email')}
            {textField('nameOnEmailAddress', t('team.company.emailFields.senderName'))}
            {textField('senderEmailAddress', t('team.company.emailFields.senderEmail'), 'email')}
            {textField('compEmailDisplayName', t('team.company.emailFields.smtpDisplayName'))}
            {textField('compEmailHost', t('team.company.emailFields.smtpHost'))}
            {textField('compEmailPort', t('team.company.emailFields.smtpPort'))}
            {textField('compEmailUserName', t('team.company.emailFields.smtpUserName'))}
            {textField('compEmailPassword', t('team.company.emailFields.smtpPassword'), 'password')}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            {t('team.company.saveInfo')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

/* -------------------------------------------------------------------------- */
/* 公司文件夹(基础)—— 后端要求 SystemOwner,非 owner 403 时仅提示。         */
/* -------------------------------------------------------------------------- */

const folderSchema = z.object({
  folderName: z.string().optional(),
  folderPath: z.string().optional(),
});
type FolderFormValues = z.infer<typeof folderSchema>;

function CompanyFolderCard({ companyId }: { companyId?: number }) {
  const { t } = useTranslation();
  const { data: folder, isLoading, isError } = useCompanyFolder(companyId);
  const updateMutation = useUpdateCompanyFolder(companyId);

  const form = useForm<FolderFormValues>({
    resolver: zodResolver(folderSchema),
    defaultValues: { folderName: '', folderPath: '' },
  });

  React.useEffect(() => {
    if (folder) {
      form.reset({ folderName: folder.folderName ?? '', folderPath: folder.folderPath ?? '' });
    }
  }, [folder, form]);

  const onSubmit = form.handleSubmit((values) => {
    if (!folder) return;
    const payload: DocFolders = {
      ...folder,
      folderName: values.folderName || undefined,
      folderPath: values.folderPath || undefined,
    };
    updateMutation.mutate(payload);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('team.company.folderTitle')}</CardTitle>
        <CardDescription>{t('team.company.folderDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : isError || !folder ? (
          <p className="text-muted-foreground text-sm">{t('team.company.folderNoAccess')}</p>
        ) : (
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="folderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('team.company.folderName')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="folderPath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('team.company.folderPath')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                  {t('team.company.saveFolder')}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}

export function CompanySettings() {
  const { user } = useAuth();
  const companyId = user?.companyID;

  return (
    <div className="max-w-3xl space-y-6">
      <CompanyProfileForm companyId={companyId} />
      <CompanyFolderCard companyId={companyId} />
    </div>
  );
}
