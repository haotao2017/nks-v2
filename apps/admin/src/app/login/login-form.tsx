'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { NksApiError } from '@nks/api-client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const loginSchema = z.object({
  userName: z.string().min(1, 'Brukernavn er påkrevd'),
  password: z.string().min(1, 'Passord er påkrevd'),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login, isPending } = useAuth();
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
      toast.success('Innlogging vellykket');
    } catch (err) {
      const message =
        err instanceof NksApiError
          ? err.status === 401
            ? 'Feil brukernavn eller passord'
            : err.message
          : err instanceof Error
            ? err.message
            : 'Innlogging feilet';
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      <div className="grid gap-2">
        <Label htmlFor="userName">Brukernavn</Label>
        <Input
          id="userName"
          autoComplete="username"
          autoFocus
          aria-invalid={!!errors.userName}
          {...register('userName')}
        />
        {errors.userName && (
          <p className="text-destructive text-sm">{errors.userName.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">Passord</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          {...register('password')}
        />
        {errors.password && (
          <p className="text-destructive text-sm">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="mt-2 w-full" disabled={isPending}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Logg inn
      </Button>
    </form>
  );
}
