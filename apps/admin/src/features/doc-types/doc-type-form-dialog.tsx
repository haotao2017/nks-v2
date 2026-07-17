'use client';

/**
 * 新建/编辑文档类型弹窗 —— 照抄 features/contacts/contact-form-dialog.tsx。
 *
 * 字段:
 *  - docName    必填文本
 *  - isRequired 开关(Switch)
 *  - partyTypeId 关联第三方类型的外键。理想是下拉选择,但为避免额外拉取
 *    partyType 列表带来的耦合(任务允许),这里先用数字输入并注明;
 *    后续可替换为 <Select> + usePartyTypes()。
 */
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import type { DocType } from '@nks/api-types';

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

import { useCreateDocType, useUpdateDocType } from './api';

const docTypeSchema = z.object({
  docName: z.string().trim().min(1, 'Navn er påkrevd'),
  isRequired: z.boolean(),
  // partyTypeId:第三方类型外键;可选,空则不发送。
  partyTypeId: z
    .string()
    .optional()
    .refine((v) => !v || /^\d+$/.test(v.trim()), 'Må være et tall'),
});

type DocTypeFormValues = z.infer<typeof docTypeSchema>;

export interface DocTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 传入即编辑模式;undefined 为新建。 */
  docType?: DocType;
}

export function DocTypeFormDialog({ open, onOpenChange, docType }: DocTypeFormDialogProps) {
  const isEdit = Boolean(docType?.id);
  const createMutation = useCreateDocType();
  const updateMutation = useUpdateDocType();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<DocTypeFormValues>({
    resolver: zodResolver(docTypeSchema),
    defaultValues: { docName: '', isRequired: false, partyTypeId: '' },
  });

  // 每次打开时同步表单值(新建清空 / 编辑回填)。
  React.useEffect(() => {
    if (open) {
      form.reset({
        docName: docType?.docName ?? '',
        isRequired: docType?.isRequired ?? false,
        partyTypeId:
          docType?.partyTypeId !== undefined && docType?.partyTypeId !== null
            ? String(docType.partyTypeId)
            : '',
      });
    }
  }, [open, docType, form]);

  const onSubmit = form.handleSubmit((values) => {
    const payload: DocType = {
      ...(docType?.id ? { id: docType.id } : {}),
      docName: values.docName,
      isRequired: values.isRequired,
      partyTypeId: values.partyTypeId ? Number(values.partyTypeId) : undefined,
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
          <DialogTitle>{isEdit ? 'Rediger dokumenttype' : 'Ny dokumenttype'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Oppdater dokumenttypen nedenfor.'
              : 'Fyll ut informasjonen for å opprette en ny dokumenttype.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="docName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Navn</FormLabel>
                  <FormControl>
                    <Input placeholder="F.eks. Ferdigattest" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isRequired"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Påkrevd</FormLabel>
                    <FormDescription>Må dokumentet leveres?</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="partyTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parttype-ID</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="F.eks. 1"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>ID til tilknyttet parttype (valgfritt).</FormDescription>
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
