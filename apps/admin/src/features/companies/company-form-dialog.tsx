'use client';

/**
 * 新建公司弹窗 —— 超级管理面板专用(AddNewCompanyProfile,需 SystemOwner)。
 * 照抄 features/team/user-form-dialog.tsx 的表单模式;body 根键 companyProfile。
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { useAddCompany } from './api';

const makeCompanySchema = (t: TFunction) =>
  z.object({
    companyName: z.string().trim().min(1, t('companies.validation.companyNameRequired')),
    organizationalNumber: z.string().optional(),
    ownerName: z.string().optional(),
    address: z.string().optional(),
    emailAddress: z.string().optional(),
  });

type CompanyFormValues = z.infer<ReturnType<typeof makeCompanySchema>>;

export interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompanyFormDialog({ open, onOpenChange }: CompanyFormDialogProps) {
  const { t } = useTranslation();
  const addMutation = useAddCompany();

  const companySchema = React.useMemo(() => makeCompanySchema(t), [t]);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: '',
      organizationalNumber: '',
      ownerName: '',
      address: '',
      emailAddress: '',
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        companyName: '',
        organizationalNumber: '',
        ownerName: '',
        address: '',
        emailAddress: '',
      });
    }
  }, [open, form]);

  const onSubmit = form.handleSubmit((values) => {
    const payload: CompanyProfile = {
      companyName: values.companyName,
      organizationalNumber: values.organizationalNumber || undefined,
      ownerName: values.ownerName || undefined,
      address: values.address || undefined,
      emailAddress: values.emailAddress || undefined,
      isActive: true,
    };
    addMutation.mutate(payload, { onSuccess: () => onOpenChange(false) });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('companies.dialog.title')}</DialogTitle>
          <DialogDescription>{t('companies.dialog.desc')}</DialogDescription>
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={addMutation.isPending}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                {t('common.create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
