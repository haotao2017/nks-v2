'use client';

/**
 * 为公司创建管理员用户弹窗 —— 超级管理面板专用(需 ROLE_ADMIN)。
 *
 * 字段:designation / userName / password。其余标志位固定:
 *   isAdmin=true、isSystemOwner=false、userTypeId=3(Begge)、isActive=true,
 *   companyId 来自所选公司行。body 根键 userProfile(CreateUserProfile)。
 * 密码为明文透传,交后端 BCrypt,不在前端加密。
 */
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import type { TFunction } from 'i18next';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import type { CompanyProfile, CreateUserProfileDto } from '@nks/api-types';

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

import { useCreateCompanyUser } from './api';

const makeAdminSchema = (t: TFunction) =>
  z.object({
    designation: z.string().optional(),
    userName: z.string().trim().min(1, t('companies.adminDialog.validation.userNameRequired')),
    password: z.string().trim().min(1, t('companies.adminDialog.validation.passwordRequired')),
  });

type AdminFormValues = z.infer<ReturnType<typeof makeAdminSchema>>;

export interface CreateAdminUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 目标公司(需含 id)。 */
  company?: CompanyProfile;
}

export function CreateAdminUserDialog({ open, onOpenChange, company }: CreateAdminUserDialogProps) {
  const { t } = useTranslation();
  const createMutation = useCreateCompanyUser();

  const adminSchema = React.useMemo(() => makeAdminSchema(t), [t]);

  const form = useForm<AdminFormValues>({
    resolver: zodResolver(adminSchema),
    defaultValues: { designation: '', userName: '', password: '' },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({ designation: '', userName: '', password: '' });
    }
  }, [open, form]);

  const onSubmit = form.handleSubmit((values) => {
    if (company?.id == null) return;
    const payload: CreateUserProfileDto = {
      designation: values.designation || undefined,
      userName: values.userName,
      password: values.password, // 明文透传
      isAdmin: true,
      isSystemOwner: false,
      companyId: company.id,
      userTypeId: 3,
      isActive: true,
    };
    createMutation.mutate(payload, { onSuccess: () => onOpenChange(false) });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('companies.adminDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('companies.adminDialog.desc', { company: company?.companyName ?? '' })}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="designation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('companies.adminDialog.designation')}</FormLabel>
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
                  <FormLabel>{t('companies.adminDialog.userName')}</FormLabel>
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
                  <FormLabel>{t('companies.adminDialog.password')}</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createMutation.isPending}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                {t('common.create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
