'use client';

/**
 * 新建/编辑用户弹窗 —— 照抄 features/party-types/party-type-form-dialog.tsx 模式。
 *
 * 字段(UserProfileDto):fullName / userName / designation / userTypeId(下拉)/
 * isActive(Switch)/ isAdmin(Switch),创建时含 password(明文,交后端 BCrypt)。
 *
 * - 创建:CreateUserProfileDto,附带当前用户 companyId(同公司)。password 必填。
 * - 编辑:UserProfileUpdateDto(带 id)。password 留空则不更新(后端约定)。
 * - 密码前端只透传明文,不加密、不硬编码。
 */
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import type { TFunction } from 'i18next';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import type {
  UserProfileDto,
  CreateUserProfileDto,
  UserProfileUpdateDto,
} from '@nks/api-types';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useCreateUser, useUpdateUser, USER_TYPE_OPTIONS } from './api';

const makeUserSchema = (t: TFunction) =>
  z
    .object({
      fullName: z.string().trim().min(1, t('team.users.validation.nameRequired')),
      userName: z.string().trim().min(1, t('team.users.validation.userNameRequired')),
      designation: z.string().optional(),
      userTypeId: z.string().min(1, t('team.users.validation.userTypeRequired')),
      isActive: z.boolean(),
      isAdmin: z.boolean(),
      password: z.string().optional(),
      isEdit: z.boolean(),
    })
    // 创建模式下密码必填;编辑模式留空表示不改。
    .refine((v) => v.isEdit || (v.password?.trim().length ?? 0) > 0, {
      message: t('team.users.validation.passwordRequired'),
      path: ['password'],
    });

type UserFormValues = z.infer<ReturnType<typeof makeUserSchema>>;

export interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 传入即编辑模式;undefined 为新建。 */
  user?: UserProfileDto;
  /** 新建时附加的公司 id(当前登录用户的 companyID)。 */
  companyId?: number;
}

export function UserFormDialog({ open, onOpenChange, user, companyId }: UserFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(user?.id);
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const userSchema = React.useMemo(() => makeUserSchema(t), [t]);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      fullName: '',
      userName: '',
      designation: '',
      userTypeId: String(USER_TYPE_OPTIONS[0].value),
      isActive: true,
      isAdmin: false,
      password: '',
      isEdit: false,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        fullName: user?.fullName ?? '',
        userName: user?.userName ?? '',
        designation: user?.designation ?? '',
        userTypeId:
          user?.userTypeId !== undefined
            ? String(user.userTypeId)
            : String(USER_TYPE_OPTIONS[0].value),
        isActive: user?.isActive ?? true,
        isAdmin: user?.isAdmin ?? false,
        password: '',
        isEdit,
      });
    }
  }, [open, user, isEdit, form]);

  const onSubmit = form.handleSubmit((values) => {
    if (isEdit && user?.id) {
      const payload: UserProfileUpdateDto = {
        id: user.id,
        fullName: values.fullName,
        userName: values.userName,
        designation: values.designation || undefined,
        userTypeId: Number(values.userTypeId),
        isActive: values.isActive,
        isAdmin: values.isAdmin,
        // 留空 → 不改密码;否则透传明文交后端 BCrypt。
        password: values.password?.trim() ? values.password : undefined,
        companyId: user.companyId,
      };
      updateMutation.mutate(payload, { onSuccess: () => onOpenChange(false) });
      return;
    }

    const payload: CreateUserProfileDto = {
      fullName: values.fullName,
      userName: values.userName,
      designation: values.designation || undefined,
      userTypeId: Number(values.userTypeId),
      isActive: values.isActive,
      isAdmin: values.isAdmin,
      password: values.password, // 明文透传
      companyId,
    };
    createMutation.mutate(payload, { onSuccess: () => onOpenChange(false) });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('team.users.dialog.editTitle') : t('team.users.dialog.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t('team.users.dialog.editDesc') : t('team.users.dialog.createDesc')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('team.users.dialog.name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('team.users.dialog.namePlaceholder')} {...field} />
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
                  <FormLabel>{t('team.users.dialog.userName')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('team.users.dialog.userNamePlaceholder')}
                      autoComplete="off"
                      {...field}
                    />
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
                  <FormLabel>{t('team.users.dialog.designation')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('team.users.dialog.designationPlaceholder')} {...field} />
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
                  <FormLabel>{t('team.users.dialog.password')}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      placeholder={
                        isEdit
                          ? t('team.users.dialog.passwordPlaceholderEdit')
                          : t('team.users.dialog.passwordPlaceholderCreate')
                      }
                      {...field}
                    />
                  </FormControl>
                  {isEdit && (
                    <FormDescription>{t('team.users.dialog.passwordEditHint')}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="userTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('team.users.dialog.userType')}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('team.users.dialog.userTypePlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {USER_TYPE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={String(o.value)}>
                          {t(`team.userTypes.${o.value}`, { defaultValue: o.label })}
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
              name="isAdmin"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t('team.users.dialog.admin')}</FormLabel>
                    <FormDescription>{t('team.users.dialog.adminHint')}</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t('team.users.dialog.active')}</FormLabel>
                    <FormDescription>{t('team.users.dialog.activeHint')}</FormDescription>
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
