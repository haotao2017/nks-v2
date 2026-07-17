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
import { zodResolver } from '@hookform/resolvers/zod';
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

import { useUserProfile, useUpdateMyProfile, userTypeLabel } from './api';

const profileSchema = z.object({
  fullName: z.string().trim().min(1, 'Navn er påkrevd'),
  userName: z.string().trim().min(1, 'Brukernavn er påkrevd'),
  designation: z.string().optional(),
  password: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function MyProfile() {
  const { user } = useAuth();
  const userId = user?.id;
  const { data: profile, isLoading } = useUserProfile(userId);
  const updateMutation = useUpdateMyProfile(userId);

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
        <CardTitle>Min profil</CardTitle>
        <CardDescription>
          {userTypeLabel(profile?.userTypeId)}
          {profile?.isAdmin ? ' · Administrator' : ''}
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
                  <FormLabel>Navn</FormLabel>
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
                  <FormLabel>Brukernavn</FormLabel>
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
                  <FormLabel>Tittel</FormLabel>
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
                  <FormLabel>Nytt passord</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      placeholder="La stå tomt for å beholde"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>La stå tomt for å beholde nåværende passord.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                Lagre
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
