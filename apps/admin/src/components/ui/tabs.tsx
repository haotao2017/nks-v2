'use client';

/**
 * Tabs —— 轻量自包含实现(不依赖 @radix-ui/react-tabs,该包未安装)。
 * 暴露与 shadcn 一致的 API:Tabs / TabsList / TabsTrigger / TabsContent,
 * new-york 样式。受控或非受控(value/defaultValue)均可。
 */
import * as React from 'react';

import { cn } from '@/lib/utils';

interface TabsContextValue {
  value: string;
  setValue: (v: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabs() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error('Tabs-komponenter må brukes inne i <Tabs>');
  return ctx;
}

export interface TabsProps extends React.ComponentProps<'div'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

function Tabs({
  value: controlled,
  defaultValue,
  onValueChange,
  className,
  ...props
}: TabsProps) {
  const [internal, setInternal] = React.useState(defaultValue ?? '');
  const value = controlled ?? internal;

  const setValue = React.useCallback(
    (v: string) => {
      if (controlled === undefined) setInternal(v);
      onValueChange?.(v);
    },
    [controlled, onValueChange],
  );

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={cn('flex flex-col gap-2', className)} {...props} />
    </TabsContext.Provider>
  );
}

function TabsList({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      role="tablist"
      className={cn(
        'bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-1',
        className,
      )}
      {...props}
    />
  );
}

export interface TabsTriggerProps extends React.ComponentProps<'button'> {
  value: string;
}

function TabsTrigger({ value, className, ...props }: TabsTriggerProps) {
  const ctx = useTabs();
  const active = ctx.value === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      data-state={active ? 'active' : 'inactive'}
      onClick={() => ctx.setValue(value)}
      className={cn(
        'ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4',
        active
          ? 'bg-background text-foreground shadow'
          : 'hover:text-foreground',
        className,
      )}
      {...props}
    />
  );
}

export interface TabsContentProps extends React.ComponentProps<'div'> {
  value: string;
}

function TabsContent({ value, className, ...props }: TabsContentProps) {
  const ctx = useTabs();
  if (ctx.value !== value) return null;
  return (
    <div
      role="tabpanel"
      className={cn('ring-offset-background focus-visible:outline-none', className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
