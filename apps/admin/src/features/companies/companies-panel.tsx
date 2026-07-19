'use client';

/**
 * 超级管理面板编排层 —— SystemOwner 门禁 + 公司列表 + 新建公司 + S3 存储桶设置。
 *
 * 门禁:CheckForSystemOwnerStatus。非 owner 只显示无权限提示,不渲染任何管理区
 * (也不发起 GetAllProfiles / GetBucketDetail —— 靠 enabled 关闭,避免无谓 403)。
 */
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Lock, Plus } from 'lucide-react';

import type { CompanyProfile, S3Bucket } from '@nks/api-types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { DataTable } from '@/components/data-table';

import {
  useSystemOwnerStatus,
  useAllCompanyProfiles,
  useBucketDetail,
  useUpdateBucket,
} from './api';
import { getCompanyColumns } from './company-columns';
import { CompanyFormDialog } from './company-form-dialog';
import { CreateAdminUserDialog } from './create-admin-user-dialog';
import { CompanyFolderDialog } from './company-folder-dialog';

/* -------------------------------------------------------------------------- */
/* S3 存储桶设置卡片                                                          */
/* -------------------------------------------------------------------------- */

const bucketSchema = z.object({
  s3bucketName: z.string().optional(),
  s3urlStaticPart: z.string().optional(),
});
type BucketFormValues = z.infer<typeof bucketSchema>;

function BucketCard() {
  const { t } = useTranslation();
  const { data: bucket, isLoading, isError } = useBucketDetail();
  const updateMutation = useUpdateBucket();

  const form = useForm<BucketFormValues>({
    resolver: zodResolver(bucketSchema),
    defaultValues: { s3bucketName: '', s3urlStaticPart: '' },
  });

  React.useEffect(() => {
    if (bucket) {
      form.reset({
        s3bucketName: bucket.s3bucketName ?? '',
        s3urlStaticPart: bucket.s3urlStaticPart ?? '',
      });
    }
  }, [bucket, form]);

  const onSubmit = form.handleSubmit((values) => {
    if (!bucket) return;
    const payload: S3Bucket = {
      ...bucket,
      s3bucketName: values.s3bucketName || undefined,
      s3urlStaticPart: values.s3urlStaticPart || undefined,
    };
    updateMutation.mutate(payload);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('companies.bucket.title')}</CardTitle>
        <CardDescription>{t('companies.bucket.desc')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : isError || !bucket ? (
          <p className="text-muted-foreground text-sm">{t('companies.bucket.loadError')}</p>
        ) : (
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="s3bucketName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('companies.bucket.name')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="s3urlStaticPart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('companies.bucket.urlStatic')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
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
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* 面板                                                                       */
/* -------------------------------------------------------------------------- */

export function CompaniesPanel() {
  const { t } = useTranslation();
  const { data: isSystemOwner, isLoading } = useSystemOwnerStatus();
  const [createOpen, setCreateOpen] = React.useState(false);
  // 编辑 / 新建管理员 / 文件夹配置各自的目标公司(null 表示关闭)。
  const [editCompany, setEditCompany] = React.useState<CompanyProfile | null>(null);
  const [adminCompany, setAdminCompany] = React.useState<CompanyProfile | null>(null);
  const [folderCompany, setFolderCompany] = React.useState<CompanyProfile | null>(null);

  const enabled = isSystemOwner === true;
  const { data: companies = [], isLoading: companiesLoading } = useAllCompanyProfiles(enabled);
  const columns = React.useMemo(
    () =>
      getCompanyColumns({
        t,
        onEdit: setEditCompany,
        onCreateAdmin: setAdminCompany,
        onFolders: setFolderCompany,
      }),
    [t],
  );

  if (isLoading) {
    return <Skeleton className="h-40 w-full max-w-2xl" />;
  }

  if (!isSystemOwner) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="text-muted-foreground size-5" />
            {t('companies.noAccessTitle')}
          </CardTitle>
          <CardDescription>{t('companies.noAccessDesc')}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          {t('companies.newCompany')}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={companies}
        isLoading={companiesLoading}
        searchColumn="companyName"
        searchPlaceholder={t('companies.searchPlaceholder')}
        emptyMessage={t('companies.empty')}
      />

      <BucketCard />

      {/* 新建公司 */}
      <CompanyFormDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* 编辑公司 */}
      <CompanyFormDialog
        open={editCompany !== null}
        onOpenChange={(open) => !open && setEditCompany(null)}
        company={editCompany ?? undefined}
      />

      {/* 新建管理员 */}
      <CreateAdminUserDialog
        open={adminCompany !== null}
        onOpenChange={(open) => !open && setAdminCompany(null)}
        company={adminCompany ?? undefined}
      />

      {/* 每公司文件夹配置 */}
      <CompanyFolderDialog
        open={folderCompany !== null}
        onOpenChange={(open) => !open && setFolderCompany(null)}
        company={folderCompany ?? undefined}
      />
    </div>
  );
}
