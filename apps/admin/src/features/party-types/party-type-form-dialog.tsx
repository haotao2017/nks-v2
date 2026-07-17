'use client';

/**
 * 新建/编辑参与方类型弹窗 —— 照抄 features/contacts/contact-form-dialog.tsx 模式。
 *
 * 字段:
 *  - name              必填
 *  - isDefault         Switch(布尔)
 *  - workflowCategoryID 下拉,选项取自 useWorkflowCategoryOptions();
 *                       含「Ingen」(不关联)选项。radix Select 值为字符串,
 *                       提交时转 number;若类别列表加载失败则下拉为空(仍可提交无关联)。
 */
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import type { PartyTypeDto } from '@nks/api-types';

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

import { useCreatePartyType, useUpdatePartyType, useWorkflowCategoryOptions } from './api';

/** 「不关联」哨兵值(radix Select 不允许空字符串 item)。 */
const NONE = 'none';

const partyTypeSchema = z.object({
  name: z.string().trim().min(1, 'Navn er påkrevd'),
  isDefault: z.boolean(),
  workflowCategoryID: z.string(),
});

type PartyTypeFormValues = z.infer<typeof partyTypeSchema>;

export interface PartyTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 传入即编辑模式;undefined 为新建。 */
  partyType?: PartyTypeDto;
}

export function PartyTypeFormDialog({
  open,
  onOpenChange,
  partyType,
}: PartyTypeFormDialogProps) {
  const isEdit = Boolean(partyType?.id);
  const createMutation = useCreatePartyType();
  const updateMutation = useUpdatePartyType();
  const { data: categories = [] } = useWorkflowCategoryOptions();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<PartyTypeFormValues>({
    resolver: zodResolver(partyTypeSchema),
    defaultValues: { name: '', isDefault: false, workflowCategoryID: NONE },
  });

  // 每次打开时同步表单值(新建清空 / 编辑回填)。
  React.useEffect(() => {
    if (open) {
      form.reset({
        name: partyType?.name ?? '',
        isDefault: partyType?.isDefault ?? false,
        workflowCategoryID:
          partyType?.workflowCategoryID !== undefined
            ? String(partyType.workflowCategoryID)
            : NONE,
      });
    }
  }, [open, partyType, form]);

  const onSubmit = form.handleSubmit((values) => {
    const payload: PartyTypeDto = {
      ...(partyType?.id ? { id: partyType.id } : {}),
      name: values.name,
      isDefault: values.isDefault,
      workflowCategoryID:
        values.workflowCategoryID === NONE ? undefined : Number(values.workflowCategoryID),
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
          <DialogTitle>{isEdit ? 'Rediger parttype' : 'Ny parttype'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Oppdater parttypen nedenfor.'
              : 'Fyll ut informasjonen for å opprette en ny parttype.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Navn</FormLabel>
                  <FormControl>
                    <Input placeholder="Parttypenavn" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workflowCategoryID"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Arbeidsflytkategori</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Velg kategori" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>Ingen</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name ?? `#${c.id}`}
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
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Standard</FormLabel>
                    <FormDescription>Bruk som standard parttype.</FormDescription>
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
