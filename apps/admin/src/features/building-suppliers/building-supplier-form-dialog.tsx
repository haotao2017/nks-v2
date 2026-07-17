'use client';

/**
 * 新建/编辑建材供应商弹窗 —— 照抄 features/contacts/contact-form-dialog.tsx。
 *
 * 字段:
 *  - title     必填文本
 *  - sortOrder 排序序号(可选数字)。注意:实体上 sortOrder 标注 @JsonIgnore,
 *    线上响应不含它、契约类型也没有它;此处仍随请求体发送(见 api.ts 说明),
 *    编辑回填时无法从响应取到,故编辑模式下默认空。
 */
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import type { BuildingSupplierDto } from '@nks/api-types';

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

import {
  useCreateBuildingSupplier,
  useUpdateBuildingSupplier,
  type BuildingSupplierPayload,
} from './api';

const buildingSupplierSchema = z.object({
  title: z.string().trim().min(1, 'Navn er påkrevd'),
  sortOrder: z
    .string()
    .optional()
    .refine((v) => !v || /^\d+$/.test(v.trim()), 'Må være et tall'),
});

type BuildingSupplierFormValues = z.infer<typeof buildingSupplierSchema>;

export interface BuildingSupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 传入即编辑模式;undefined 为新建。 */
  buildingSupplier?: BuildingSupplierDto;
}

export function BuildingSupplierFormDialog({
  open,
  onOpenChange,
  buildingSupplier,
}: BuildingSupplierFormDialogProps) {
  const isEdit = Boolean(buildingSupplier?.id);
  const createMutation = useCreateBuildingSupplier();
  const updateMutation = useUpdateBuildingSupplier();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<BuildingSupplierFormValues>({
    resolver: zodResolver(buildingSupplierSchema),
    defaultValues: { title: '', sortOrder: '' },
  });

  // 每次打开时同步表单值(新建清空 / 编辑回填)。
  // sortOrder 线上不返回,编辑模式下无法回填,保持空。
  React.useEffect(() => {
    if (open) {
      form.reset({
        title: buildingSupplier?.title ?? '',
        sortOrder: '',
      });
    }
  }, [open, buildingSupplier, form]);

  const onSubmit = form.handleSubmit((values) => {
    const payload: BuildingSupplierPayload = {
      ...(buildingSupplier?.id ? { id: buildingSupplier.id } : {}),
      title: values.title,
      sortOrder: values.sortOrder ? Number(values.sortOrder) : undefined,
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
            {isEdit ? 'Rediger byggevareleverandør' : 'Ny byggevareleverandør'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Oppdater byggevareleverandøren nedenfor.'
              : 'Fyll ut informasjonen for å opprette en ny byggevareleverandør.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Navn</FormLabel>
                  <FormControl>
                    <Input placeholder="F.eks. Byggmax" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sortOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sortering</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="F.eks. 1"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Rekkefølge i listen (valgfritt).</FormDescription>
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
                Avbryt
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? 'Lagre' : 'Opprett'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
