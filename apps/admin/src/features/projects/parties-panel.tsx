'use client';

/**
 * 项目参与方关联面板 —— 对应原系统 Wf1S7-la-til-foretak。
 *
 * 交互:
 *  - 按 party type 列出项目参与方:每行显示 party type 名 + 当前已绑联系人(名 / 邮箱),未绑显示占位。
 *  - 每行「绑定 / 更换」按钮打开弹窗,弹窗内可搜索选择一个联系人,确认后调
 *    AssociatePartyWithProjectPartyType(body { projectParty:{ projectId, partyId, partyTypeId } })。
 *
 * 说明:
 *  - party type 全量来自 usePartyTypes;当前绑定来自 useProjectParties,按 partyTypeId 建索引。
 *  - 联系人下拉沿用 contact-select 的可搜索 combobox 模式(Popover + Command),仅做选择,不含新建/编辑。
 *  - 后端为「插入新关联」语义,重复关联返回软失败,由 useAssociateProjectParty 统一 toast。
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';

import type { ContactDto, PartyTypeDto, ProjectPartyDto } from '@nks/api-types';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

import {
  useAssociateProjectParty,
  useContacts,
  usePartyTypes,
  useProjectParties,
} from './party-api';
import { filterPartyTypesForForetak } from './party-type-filter';

/** 选项 label:`Name (CompanyName)`,公司名为空时只显示 Name(对齐 contact-select)。 */
function contactLabel(c: ContactDto): string {
  const name = c.name ?? '';
  return c.companyName ? `${name} (${c.companyName})` : name;
}

// ── 主面板 ──────────────────────────────────────────────────────────────

export function ProjectPartiesPanel({ projectId }: { projectId: number }) {
  const { t } = useTranslation();

  const { data: partyTypes = [], isLoading } = usePartyTypes();
  const { data: parties = [] } = useProjectParties(projectId);

  // 按 partyTypeId 建索引:当前项目每个 party type 的绑定(如有)。
  const partyByTypeId = React.useMemo(() => {
    const map = new Map<number, ProjectPartyDto>();
    parties.forEach((p) => {
      if (p.partyTypeId != null) map.set(p.partyTypeId, p);
    });
    return map;
  }, [parties]);

  // 对齐旧 Wf1S7:已绑定全显示;未绑定仅 workflowCategoryID === 1。
  const visiblePartyTypes = React.useMemo(
    () => filterPartyTypesForForetak(partyTypes, new Set(partyByTypeId.keys())),
    [partyTypes, partyByTypeId],
  );

  const [target, setTarget] = React.useState<PartyTypeDto | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('partiesPanel.title')}</CardTitle>
        <CardDescription>{t('partiesPanel.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('partiesPanel.columns.partyType')}</TableHead>
                <TableHead>{t('partiesPanel.columns.contact')}</TableHead>
                <TableHead className="w-32">
                  <span className="sr-only">{t('common.actions')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {Array.from({ length: 3 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : visiblePartyTypes.length ? (
                visiblePartyTypes.map((pt) => {
                  const bound = pt.id != null ? partyByTypeId.get(pt.id) : undefined;
                  return (
                    <TableRow key={pt.id}>
                      <TableCell className="font-medium">{pt.name || '—'}</TableCell>
                      <TableCell>
                        {bound?.partyName ? (
                          <div className="flex flex-col">
                            <span>{bound.partyName}</span>
                            {bound.contactNumber ? (
                              <span className="text-muted-foreground text-sm">
                                {bound.contactNumber}
                              </span>
                            ) : null}
                            {bound.email ? (
                              <span className="text-muted-foreground text-sm">{bound.email}</span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            {t('partiesPanel.notBound')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setTarget(pt)}>
                          {bound ? t('partiesPanel.changeButton') : t('partiesPanel.bindButton')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground h-24 text-center">
                    {t('partiesPanel.empty')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <AssociatePartyDialog
        projectId={projectId}
        partyType={target}
        currentPartyId={
          target?.id != null ? partyByTypeId.get(target.id)?.partyId ?? null : null
        }
        onClose={() => setTarget(null)}
      />
    </Card>
  );
}

// ── 绑定 / 更换 弹窗 ────────────────────────────────────────────────────

function AssociatePartyDialog({
  projectId,
  partyType,
  currentPartyId,
  onClose,
}: {
  projectId: number;
  partyType: PartyTypeDto | null;
  currentPartyId: number | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const open = partyType !== null;

  const { data: contacts = [] } = useContacts();
  const associateMutation = useAssociateProjectParty(projectId);

  const [selectedId, setSelectedId] = React.useState<string>('');
  const [pickerOpen, setPickerOpen] = React.useState(false);

  // 每次打开:预选当前已绑联系人(便于「更换」时看到起点)。
  // 用渲染期调整 state(检测 open 由关变开),不在 effect 内 setState,避免级联渲染。
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setSelectedId(currentPartyId != null ? String(currentPartyId) : '');
  }

  const selected = React.useMemo(
    () => contacts.find((c) => String(c.id) === selectedId),
    [contacts, selectedId],
  );

  const isChange = currentPartyId != null;

  const submit = () => {
    if (!partyType?.id || !selected?.id) return;
    associateMutation.mutate(
      { partyId: selected.id, partyTypeId: partyType.id },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isChange
              ? t('partiesPanel.dialog.changeTitle', { name: partyType?.name ?? '' })
              : t('partiesPanel.dialog.bindTitle', { name: partyType?.name ?? '' })}
          </DialogTitle>
          <DialogDescription>{t('partiesPanel.dialog.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label>{t('partiesPanel.dialog.contactLabel')}</Label>
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={pickerOpen}
                className="w-full justify-between font-normal"
              >
                <span className="truncate">
                  {selected ? contactLabel(selected) : t('partiesPanel.select.placeholder')}
                </span>
                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
              <Command>
                <CommandInput placeholder={t('partiesPanel.select.search')} />
                <CommandList>
                  <CommandEmpty>{t('partiesPanel.select.empty')}</CommandEmpty>
                  <CommandGroup>
                    {contacts.map((c) => {
                      const id = String(c.id);
                      return (
                        <CommandItem
                          key={id}
                          value={`${contactLabel(c)} ${id}`}
                          onSelect={() => {
                            setSelectedId(id);
                            setPickerOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'size-4',
                              selectedId === id ? 'opacity-100' : 'opacity-0',
                            )}
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
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={associateMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={!selected || associateMutation.isPending}
          >
            {associateMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
