'use client';

/**
 * Min profil —— 当前登录用户查看/编辑自己的资料。
 *
 * - 读取:useAuth 拿当前用户 id → GetUserProfile?UserProfileID=<id>。
 * - 更新:UpdateUserProfile(useUpdateMyProfile)。仅改姓名/用户名/职称/密码;
 *   isAdmin / isActive / userTypeId / companyId 从已加载资料原样带回,避免被清空
 *   (用户不能在此提升自己的权限)。
 * - 密码留空表示不修改;填了就明文透传后端 BCrypt。
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
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';

import { useUserProfile, useUpdateMyProfile } from './api';

const makeProfileSchema = (t: TFunction) =>
  z.object({
    fullName: z.string().trim().min(1, t('team.profile.validation.nameRequired')),
    userName: z.string().trim().min(1, t('team.profile.validation.userNameRequired')),
    designation: z.string().optional(),
    password: z.string().optional(),
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
    defaultValues: { fullName: '', userName: '', designation: '', password: '' },
  });

  React.useEffect(() => {
    if (profile) {
      form.reset({
        fullName: profile.fullName ?? '',
        userName: profile.userName ?? '',
        designation: profile.designation ?? '',
        password: '',
      });
    }
  }, [profile, form]);

  const onSubmit = form.handleSubmit((values) => {
    if (!profile?.id) return;
    const payload: UserProfileUpdateDto = {
      // 原样保留权限/状态/类型/公司,只覆盖用户可编辑字段。
      ...profile,
      id: profile.id,
      fullName: values.fullName,
      userName: values.userName,
      designation: values.designation || undefined,
      password: values.password?.trim() ? values.password : undefined,
    };
    updateMutation.mutate(payload);
  });

  if (isLoading) {
    return (
      <Card className="max-w-2xl">
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
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{t('team.profile.title')}</CardTitle>
        <CardDescription>
          {t(`team.userTypes.${profile?.userTypeId}`, { defaultValue: t('team.userTypes.unknown') })}
          {profile?.isAdmin ? ` · ${t('team.profile.administrator')}` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('team.profile.name')}</FormLabel>
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
