'use client';

/**
 * 超级管理面板编排层 —— SystemOwner 门禁 + 公司列表 + 新建公司 + S3 存储桶设置。
 *
 * 门禁:CheckForSystemOwnerStatus。非 owner 只显示无权限提示,不渲染任何管理区
 * (也不发起 GetAllProfiles / GetBucketDetail —— 靠 enabled 关闭,避免无谓 403)。
 */
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Lock, Plus } from 'lucide-react';

import type { S3Bucket } from '@nks/api-types';

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

/* -------------------------------------------------------------------------- */
/* S3 存储桶设置卡片                                                          */
/* -------------------------------------------------------------------------- */

const bucketSchema = z.object({
  s3bucketName: z.string().optional(),
  s3urlStaticPart: z.string().optional(),
});
type BucketFormValues = z.infer<typeof bucketSchema>;

function BucketCard() {
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
        <CardTitle>S3-lagring</CardTitle>
        <CardDescription>Global bøtte-konfigurasjon for dokumentlagring.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : isError || !bucket ? (
          <p className="text-muted-foreground text-sm">Kunne ikke laste bøtteinnstillinger.</p>
        ) : (
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="s3bucketName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bøttenavn</FormLabel>
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
                    <FormLabel>URL (statisk del)</FormLabel>
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
                  Lagre
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
  const { data: isSystemOwner, isLoading } = useSystemOwnerStatus();
  const [createOpen, setCreateOpen] = React.useState(false);

  const enabled = isSystemOwner === true;
  const { data: companies = [], isLoading: companiesLoading } = useAllCompanyProfiles(enabled);
  const columns = React.useMemo(() => getCompanyColumns(), []);

  if (isLoading) {
    return <Skeleton className="h-40 w-full max-w-2xl" />;
  }

  if (!isSystemOwner) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="text-muted-foreground size-5" />
            Ingen tilgang
          </CardTitle>
          <CardDescription>
            Denne siden er kun tilgjengelig for systemeiere.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Nytt selskap
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={companies}
        isLoading={companiesLoading}
        searchColumn="companyName"
        searchPlaceholder="Søk etter selskap…"
        emptyMessage="Ingen selskaper enda."
      />

      <BucketCard />

      <CompanyFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
