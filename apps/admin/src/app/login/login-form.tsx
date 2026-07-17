'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { NksApiError } from '@nks/api-client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const loginSchema = z.object({
  userName: z.string().min(1, 'login.userNameRequired'),
  password: z.string().min(1, 'login.passwordRequired'),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login, isPending } = useAuth();
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { userName: '', password: '' },
  });

  const onSubmit = async (values: LoginValues) => {
    try {
      await login(values);
      toast.success(t('login.loginSuccess'));
    } catch (err) {
      const message =
        err instanceof NksApiError
          ? err.status === 401
            ? t('login.invalidCredentials')
            : err.message
          : err instanceof Error
            ? err.message
            : t('login.loginFailed');
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      <div className="grid gap-2">
        <Label htmlFor="userName">{t('login.userName')}</Label>
        <Input
          id="userName"
          autoComplete="username"
          autoFocus
          aria-invalid={!!errors.userName}
          {...register('userName')}
        />
        {errors.userName && (
          <p className="text-destructive text-sm">{t(errors.userName.message ?? '')}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">{t('login.password')}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          {...register('password')}
        />
        {errors.password && (
          <p className="text-destructive text-sm">{t(errors.password.message ?? '')}</p>
        )}
      </div>

      <Button type="submit" className="mt-2 w-full" disabled={isPending}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        {t('login.submit')}
      </Button>
    </form>
  );
}
