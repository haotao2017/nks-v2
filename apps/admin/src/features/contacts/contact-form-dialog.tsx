'use client';

/**
 * 新建/编辑联系人弹窗 —— CRUD 表单模式样板。
 *
 * - 受控:由父组件持有 open / onOpenChange。
 * - contact 传入即编辑模式(带 id),否则新建。
 * - zod 校验:name 必填、email 可选但需合法格式。
 * - 提交成功后关闭弹窗;失败 toast 由 api hook 统一处理。
 */
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import type { ContactDto } from '@nks/api-types';

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

import { useCreateContact, useUpdateContact } from './api';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** 校验消息随语言变化,故 schema 在组件内按 t 重建。 */
type ContactFormValues = {
  name: string;
  contactNo: string;
  email: string;
  companyName?: string;
};

export interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 传入即编辑模式;undefined 为新建。 */
  contact?: ContactDto;
}

export function ContactFormDialog({ open, onOpenChange, contact }: ContactFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(contact?.id);
  const createMutation = useCreateContact();
  const updateMutation = useUpdateContact();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const contactSchema = React.useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t('contacts.validation.nameRequired')),
        contactNo: z.string().trim().min(1, t('contacts.validation.phoneRequired')),
        email: z
          .string()
          .trim()
          .min(1, t('contacts.validation.emailRequired'))
          .refine((v) => EMAIL_RE.test(v), t('contacts.validation.emailInvalid')),
        companyName: z.string().optional(),
      }),
    [t],
  );

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', contactNo: '', email: '', companyName: '' },
  });

  // 每次打开时同步表单值(新建清空 / 编辑回填)。
  React.useEffect(() => {
    if (open) {
      form.reset({
        name: contact?.name ?? '',
        contactNo: contact?.contactNo ?? '',
        email: contact?.email ?? '',
        companyName: contact?.companyName ?? '',
      });
    }
  }, [open, contact, form]);

  const onSubmit = form.handleSubmit((values) => {
    const payload: ContactDto = {
      ...(contact?.id ? { id: contact.id } : {}),
      name: values.name,
      contactNo: values.contactNo || undefined,
      email: values.email || undefined,
      companyName: values.companyName || undefined,
    };

    const mutation = isEdit ? updateMutation : createMutation;
    mutation.mutate(payload, {
      onSuccess: () => onOpenChange(false),
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('contacts.form.editTitle') : t('contacts.form.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t('contacts.form.editDescription') : t('contacts.form.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('contacts.form.name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('contacts.form.namePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('contacts.form.email')}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder={t('contacts.form.emailPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('contacts.form.phone')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('contacts.form.phonePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('contacts.form.company')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('contacts.form.companyPlaceholder')} {...field} />
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
