'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';

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

function currentLabel(pathname: string): string {
  const match = [...navItems]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) =>
      item.href === '/' ? pathname === '/' : pathname.startsWith(item.href),
    );
  return match?.label ?? 'NKS Admin';
}

export function Topbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const items = navItems.filter((item) => !item.adminOnly || user?.isAdmin);

  return (
    <header className="bg-background/80 sticky top-0 z-10 flex h-14 items-center gap-2 border-b px-4 backdrop-blur">
      {/* 移动端导航 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Åpne meny">
            <Menu />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {items.map((item) => (
            <DropdownMenuItem key={item.href} asChild>
              <Link href={item.href}>
                <item.icon />
                {item.label}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <h1 className="text-sm font-semibold">{currentLabel(pathname)}</h1>

      <div className="ml-auto">
        <UserMenu />
      </div>
    </header>
  );
}
