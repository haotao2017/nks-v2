'use client';

/**
 * 每公司 S3 文件夹(DocFolders)配置弹窗 —— 超级管理面板专用(需 SystemOwner)。
 *
 * 打开时用 GetSingleCompanyFolder 拉取该公司现有文件夹:
 *  - 已存在(有 id) → UpdateSingleCompanyFolder;
 *  - 不存在        → AddCompanyFolder。
 * body 根键 DocFolders。注意这是「每公司」文件夹,与全局 S3 桶(BucketCard)无关。
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
import { Skeleton } from '@/components/ui/skeleton';

import { useCompanyFolder, useAddCompanyFolder, useUpdateCompanyFolder } from './api';

const makeFolderSchema = (t: TFunction) =>
  z.object({
    folderName: z.string().trim().min(1, t('companies.folderDialog.validation.folderNameRequired')),
    folderPath: z.string().optional(),
  });

type FolderFormValues = z.infer<ReturnType<typeof makeFolderSchema>>;

export interface CompanyFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 目标公司(需含 id)。 */
  company?: CompanyProfile;
}

export function CompanyFolderDialog({ open, onOpenChange, company }: CompanyFolderDialogProps) {
  const { t } = useTranslation();
  const companyId = company?.id;

  const { data: folder, isLoading } = useCompanyFolder(companyId, open);
  const addMutation = useAddCompanyFolder(companyId);
  const updateMutation = useUpdateCompanyFolder(companyId);
  const isPending = addMutation.isPending || updateMutation.isPending;
  const isExisting = folder?.id != null;

  const folderSchema = React.useMemo(() => makeFolderSchema(t), [t]);

  const form = useForm<FolderFormValues>({
    resolver: zodResolver(folderSchema),
    defaultValues: { folderName: '', folderPath: '' },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        folderName: folder?.folderName ?? '',
        folderPath: folder?.folderPath ?? '',
      });
    }
  }, [open, folder, form]);

  const onSubmit = form.handleSubmit((values) => {
    if (companyId == null) return;
    const folderPath = values.folderPath?.trim() || `/${values.folderName.trim()}`;
    const payload: DocFolders = {
      ...(folder?.id != null ? { id: folder.id } : {}),
      companyId,
      folderName: values.folderName,
      folderPath,
      isActive: true,
    };
    const mutation = isExisting ? updateMutation : addMutation;
    mutation.mutate(payload, { onSuccess: () => onOpenChange(false) });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('companies.folderDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('companies.folderDialog.desc', { company: company?.companyName ?? '' })}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="folderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('companies.folderDialog.folderName')}</FormLabel>
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
                    <FormLabel>{t('companies.folderDialog.folderPath')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('companies.folderDialog.folderPathPlaceholder')} {...field} />
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
                  {t('common.save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
