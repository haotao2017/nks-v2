'use client';

/**
 * Min profil —— 当前登录用户查看/编辑自己的资料。对齐原系统 teamInfo/userProfile.js 字段:
 *   - Tittel(designation)/ Brukernavn(userName)/ Passord(password)
 *   - 关联联系人(contactId,复用 ContactSelect;右侧 Name/Selskapsnavn/Contact No/E-mail 是联系人字段)
 *   - Aktiv(isActive)/ Admin(isAdmin)/ Brukertype(userTypeId:1=Mobil,2=Desktop,3=Begge)
 * 名字取自关联联系人,故本表单不单列 fullName(提交时原样保留)。密码留空=不改。
 */
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import type { TFunction } from 'i18next';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import type { UserProfileUpdateDto } from '@nks/api-types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { ContactSelect } from '@/features/projects/wizard/contact-select';

import { useUserProfile, useUpdateMyProfile } from './api';

/** Brukertype 选项(与原系统一致:1=Mobil,2=Desktop,3=Begge)。 */
const USER_TYPE_VALUES = ['1', '2', '3'] as const;

const makeProfileSchema = (t: TFunction) =>
  z.object({
    userName: z.string().trim().min(1, t('team.profile.validation.userNameRequired')),
    designation: z.string().optional(),
    password: z.string().optional(),
    contactId: z.string().optional(),
    isActive: z.boolean(),
    isAdmin: z.boolean(),
    userTypeId: z.string().optional(),
  });

type ProfileFormValues = z.infer<ReturnType<typeof makeProfileSchema>>;

export function MyProfile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id;
  const { data: profile, isLoading } = useUserProfile(userId);
  const updateMutation = useUpdateMyProfile(userId);

  const profileSchema = React.useMemo(() => makeProfileSchema(t), [t]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      userName: '',
      designation: '',
      password: '',
      contactId: '',
      isActive: true,
      isAdmin: false,
      userTypeId: '',
    },
  });

  React.useEffect(() => {
    if (profile) {
      form.reset({
        userName: profile.userName ?? '',
        designation: profile.designation ?? '',
        password: '',
        contactId: profile.contactId != null ? String(profile.contactId) : '',
        isActive: profile.isActive ?? true,
        isAdmin: profile.isAdmin ?? false,
        userTypeId: profile.userTypeId != null ? String(profile.userTypeId) : '',
      });
    }
  }, [profile, form]);

  const onSubmit = form.handleSubmit((values) => {
    if (!profile?.id) return;
    const payload: UserProfileUpdateDto = {
      ...profile, // 保留 fullName/companyId 等未在此编辑的字段
      id: profile.id,
      userName: values.userName,
      designation: values.designation || undefined,
      password: values.password?.trim() ? values.password : undefined,
      contactId: values.contactId ? Number(values.contactId) : undefined,
      isActive: values.isActive,
      isAdmin: values.isAdmin,
      userTypeId: values.userTypeId ? Number(values.userTypeId) : undefined,
    };
    updateMutation.mutate(payload);
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('team.profile.title')}</CardTitle>
        <CardDescription>{t('team.profile.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* 用户字段 */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('team.profile.designation')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="userName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('team.profile.userName')}</FormLabel>
                      <FormControl>
                        <Input autoComplete="off" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('team.profile.newPassword')}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          placeholder={t('team.profile.passwordPlaceholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>{t('team.profile.passwordHint')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 关联联系人(Name/Selskapsnavn/Contact No/E-mail 由 ContactSelect 承载)*/}
              <div className="space-y-2">
                <FormLabel>{t('team.profile.contact')}</FormLabel>
                <FormField
                  control={form.control}
                  name="contactId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ContactSelect value={field.value ?? ''} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Aktiv / Admin / Brukertype */}
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <FormLabel>{t('team.profile.active')}</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isAdmin"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <FormLabel>{t('team.profile.admin')}</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="userTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('team.profile.userType')}</FormLabel>
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t('team.profile.userTypePlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {USER_TYPE_VALUES.map((v) => (
                          <SelectItem key={v} value={v}>
                            {t(`team.userTypes.${v}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                {t('common.save')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
