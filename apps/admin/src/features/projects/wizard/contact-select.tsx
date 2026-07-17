'use client';

/**
 * ContactSelect —— 1:1 复刻旧系统 shared-components/SelectContact 的行为。
 *
 * - 可搜索下拉(Popover + Command combobox),选项 = 所有联系人,
 *   label 形如 `Name (CompanyName)`(公司名为空则只显示 Name)。
 * - 选中某联系人 → 回填 Name / Selskapsnavn / Contact No / E-mail 到下方四个只读字段,
 *   并通过 onChange 把该联系人 id(string)写回表单(customerId / contactPersonId)。
 * - ✎ 编辑:四字段变可编辑,提交调 UpdateContact,完成回只读态。
 * - + 新建:清空四字段进入新建态,提交调 CreatContact,成功后自动选中新建联系人。
 * - 四字段平时 disabled(只读展示),仅编辑/新建态可填。
 * - 提交前查重:同 name+companyName+contactNo+email 已存在则 toast 报错(与旧系统一致,含自身)。
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown, Loader2, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';

import type { ContactDto } from '@nks/api-types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

import { useContacts, useCreateContact, useUpdateContact } from '@/features/contacts/api';

type Mode = 'view' | 'edit' | 'add';

type Fields = { name: string; companyName: string; contactNo: string; email: string };

const EMPTY_FIELDS: Fields = { name: '', companyName: '', contactNo: '', email: '' };

/** 选项 label:`Name (CompanyName)`,公司名为空时只显示 Name。 */
function contactLabel(c: ContactDto): string {
  const name = c.name ?? '';
  return c.companyName ? `${name} (${c.companyName})` : name;
}

export interface ContactSelectProps {
  /** 当前选中的联系人 id(string,空串表示未选)。 */
  value: string;
  /** 选中变化时回调。 */
  onChange: (id: string) => void;
}

export function ContactSelect({ value, onChange }: ContactSelectProps) {
  const { t } = useTranslation();
  const { data: contacts = [] } = useContacts();
  const createMutation = useCreateContact();
  const updateMutation = useUpdateContact();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<Mode>('view');
  const [fields, setFields] = React.useState<Fields>(EMPTY_FIELDS);

  const selected = React.useMemo(
    () => contacts.find((c) => String(c.id) === value),
    [contacts, value],
  );

  const editing = mode === 'edit' || mode === 'add';

  /** 选中项映射到展示字段(公司名等空值归一为空串)。 */
  const fieldsFromSelected = (c: ContactDto | undefined): Fields =>
    c
      ? {
          name: c.name ?? '',
          companyName: c.companyName ?? '',
          contactNo: c.contactNo ?? '',
          email: c.email ?? '',
        }
      : EMPTY_FIELDS;

  // 只读态:展示字段直接从选中项派生(无需 effect+setState);编辑/新建态用本地草稿 fields。
  const displayFields = editing ? fields : fieldsFromSelected(selected);

  const setField = (k: keyof Fields, v: string) => setFields((prev) => ({ ...prev, [k]: v }));

  const startEdit = () => {
    setFields(fieldsFromSelected(selected)); // 从选中项种入草稿
    setMode('edit');
  };
  const startAdd = () => {
    setFields(EMPTY_FIELDS);
    setMode('add');
  };
  const cancel = () => setMode('view'); // 回只读态,展示字段自动派生回选中项

  const submit = () => {
    // 查重:同 name+companyName+contactNo+email 已存在(与旧系统一致)。
    // 编辑态排除当前联系人自身,否则未改动字段直接更新会误报"已存在"(修正旧系统的 quirk)。
    const dup = contacts.find(
      (c) =>
        !(mode === 'edit' && selected?.id != null && c.id === selected.id) &&
        (c.name ?? '') === fields.name &&
        (c.companyName ?? '') === fields.companyName &&
        (c.contactNo ?? '') === fields.contactNo &&
        (c.email ?? '') === fields.email,
    );
    if (dup) {
      toast.error(t('contactSelect.duplicate'));
      return;
    }

    if (mode === 'edit') {
      if (selected?.id == null) return;
      updateMutation.mutate(
        {
          id: selected.id,
          name: fields.name || undefined,
          companyName: fields.companyName || undefined,
          contactNo: fields.contactNo || undefined,
          email: fields.email || undefined,
        },
        { onSuccess: () => setMode('view') },
      );
    } else {
      createMutation.mutate(
        {
          name: fields.name || undefined,
          companyName: fields.companyName || undefined,
          contactNo: fields.contactNo || undefined,
          email: fields.email || undefined,
        },
        {
          onSuccess: (created) => {
            setMode('view');
            if (created?.id != null) onChange(String(created.id)); // 自动选中新建项
          },
        },
      );
    }
  };

  return (
    <div className="space-y-3">
      {/* 可搜索下拉 + 编辑/新建按钮 */}
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={editing}
              className="flex-1 justify-between font-normal"
            >
              <span className="truncate">
                {selected ? contactLabel(selected) : t('contactSelect.placeholder')}
              </span>
              <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
            <Command>
              <CommandInput placeholder={t('contactSelect.search')} />
              <CommandList>
                <CommandEmpty>{t('contactSelect.empty')}</CommandEmpty>
                <CommandGroup>
                  {contacts.map((c) => {
                    const id = String(c.id);
                    return (
                      <CommandItem
                        key={id}
                        value={`${contactLabel(c)} ${id}`}
                        onSelect={() => {
                          onChange(id);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn('size-4', value === id ? 'opacity-100' : 'opacity-0')}
                        />
                        <span className="truncate">{contactLabel(c)}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={editing || !selected}
          onClick={startEdit}
          aria-label={t('contactSelect.editAria')}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={editing}
          onClick={startAdd}
          aria-label={t('contactSelect.addAria')}
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {/* 四字段:平时只读展示,编辑/新建态可填 */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="contact-name">{t('contactSelect.name')}</Label>
          <Input
            id="contact-name"
            disabled={!editing}
            value={displayFields.name}
            onChange={(e) => setField('name', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-company">{t('contactSelect.companyName')}</Label>
          <Input
            id="contact-company"
            disabled={!editing}
            value={displayFields.companyName}
            onChange={(e) => setField('companyName', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-no">{t('contactSelect.contactNo')}</Label>
          <Input
            id="contact-no"
            disabled={!editing}
            value={displayFields.contactNo}
            onChange={(e) => setField('contactNo', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-email">{t('contactSelect.email')}</Label>
          <Input
            id="contact-email"
            disabled={!editing}
            value={displayFields.email}
            onChange={(e) => setField('email', e.target.value)}
          />
        </div>
      </div>

      {/* 编辑/新建态:提交 + 取消 */}
      {editing && (
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={submit} disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {mode === 'edit' ? t('contactSelect.update') : t('contactSelect.create')}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={cancel} disabled={isPending}>
            {t('contactSelect.cancel')}
          </Button>
        </div>
      )}
    </div>
  );
}
