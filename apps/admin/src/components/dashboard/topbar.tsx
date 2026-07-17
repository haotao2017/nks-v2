'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Languages, Menu } from 'lucide-react';

import { navItems } from '@/lib/nav';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenu } from './user-menu';

function currentLabelKey(pathname: string): string {
  const match = [...navItems]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) =>
      item.href === '/' ? pathname === '/' : pathname.startsWith(item.href),
    );
  return match?.labelKey ?? '';
}

export function Topbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const items = navItems.filter((item) => !item.adminOnly || user?.isAdmin);
  const labelKey = currentLabelKey(pathname);

  return (
    <header className="bg-background/80 sticky top-0 z-10 flex h-14 items-center gap-2 border-b px-4 backdrop-blur">
      {/* 移动端导航 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label={t('common.openMenu')}>
            <Menu />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {items.map((item) => (
            <DropdownMenuItem key={item.href} asChild>
              <Link href={item.href}>
                <item.icon />
                {t(item.labelKey)}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <h1 className="text-sm font-semibold">
        {labelKey ? t(labelKey) : t('common.appName')}
      </h1>

      <div className="ml-auto flex items-center gap-1">
        {/* 语言切换 NO ⇄ EN */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              aria-label={t('common.language')}
            >
              <Languages className="size-4" />
              <span className="text-xs font-medium uppercase">
                {i18n.language.startsWith('en') ? 'EN' : 'NO'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onClick={() => void i18n.changeLanguage('no')}>
              Norsk (NO)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void i18n.changeLanguage('en')}>
              English (EN)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <UserMenu />
      </div>
    </header>
  );
}
