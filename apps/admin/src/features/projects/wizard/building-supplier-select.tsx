'use client';

/**
 * BuildingSupplierSelect —— 对齐旧系统 projectConfig/tabs/ProjectInfo.js 的 Husleverandør 控件。
 *
 * - 可搜索下拉(Popover + Command),选项 = GetAllBuildingSupplier 返回的 multiBuildingSuppliers,
 *   label = 供应商 `title`。
 * - ➕ 加号:弹出小表单(仅 title 一个字段),提交调 CreatBuildingSupplier(body { buildingSupplier: { title } }),
 *   成功后刷新列表并自动选中新建项(与旧系统 setValue('buildingSupplierId', res.buildingSupplier.id) 一致)。
 * - 选中值通过 onChange 以 string 形式写回表单(buildingSupplierId)。
 *
 * 仿 contact-select.tsx,但旧系统此处只有「新建」没有「编辑」,故不含编辑态。
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronsUpDown, Check, Loader2, Plus } from 'lucide-react';

import type { BuildingSupplierDto } from '@nks/api-types';

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

import { useBuildingSuppliers, useCreateBuildingSupplier } from '@/features/building-suppliers/api';

export interface BuildingSupplierSelectProps {
  /** 当前选中的供应商 id(string,空串表示未选)。 */
  value: string;
  /** 选中变化时回调。 */
  onChange: (id: string) => void;
}

function supplierLabel(s: BuildingSupplierDto): string {
  return s.title ?? '';
}

export function BuildingSupplierSelect({ value, onChange }: BuildingSupplierSelectProps) {
  const { t } = useTranslation();
  const { data: suppliers = [] } = useBuildingSuppliers();
  const createMutation = useCreateBuildingSupplier();

  const [open, setOpen] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const [title, setTitle] = React.useState('');

  const selected = React.useMemo(
    () => suppliers.find((s) => String(s.id) === value),
    [suppliers, value],
  );

  const startAdd = () => {
    setTitle('');
    setAdding(true);
  };
  const cancelAdd = () => {
    setTitle('');
    setAdding(false);
  };

  const submitAdd = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    createMutation.mutate(
      { title: trimmed },
      {
        onSuccess: (created) => {
          setAdding(false);
          setTitle('');
          if (created?.id != null) onChange(String(created.id)); // 自动选中新建项
        },
      },
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={adding}
              className="flex-1 justify-between font-normal"
            >
              <span className="truncate">
                {selected ? supplierLabel(selected) : t('projectWizard.buildingSupplierSelect.placeholder')}
              </span>
              <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
            <Command>
              <CommandInput placeholder={t('projectWizard.buildingSupplierSelect.search')} />
              <CommandList>
                <CommandEmpty>{t('projectWizard.buildingSupplierSelect.empty')}</CommandEmpty>
                <CommandGroup>
                  {suppliers.map((s) => {
                    const id = String(s.id);
                    return (
                      <CommandItem
                        key={id}
                        value={`${supplierLabel(s)} ${id}`}
                        onSelect={() => {
                          onChange(id);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn('size-4', value === id ? 'opacity-100' : 'opacity-0')}
                        />
                        <span className="truncate">{supplierLabel(s)}</span>
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
          disabled={adding}
          onClick={startAdd}
          aria-label={t('projectWizard.buildingSupplierSelect.addAria')}
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {/* 新建态:仅 title 一个字段 */}
      {adding && (
        <div className="space-y-3 rounded-md border p-3">
          <div className="space-y-1.5">
            <Label htmlFor="building-supplier-title">
              {t('projectWizard.buildingSupplierSelect.titleLabel')}
            </Label>
            <Input
              id="building-supplier-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={submitAdd}
              disabled={createMutation.isPending || !title.trim()}
            >
              {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              {t('projectWizard.buildingSupplierSelect.create')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={cancelAdd}
              disabled={createMutation.isPending}
            >
              {t('projectWizard.buildingSupplierSelect.cancel')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
