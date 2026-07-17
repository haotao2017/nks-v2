'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Switch —— 依赖无关的受控开关。
 *
 * 说明:项目当前未安装 @radix-ui/react-switch(为避免与并行任务争抢依赖安装,
 * 此处用原生 `<button role="switch">` 实现),但对外 API 与 shadcn/radix 版本一致
 * (checked / onCheckedChange / disabled),后续若引入 radix 可无痛替换。
 */
export interface SwitchProps
  extends Omit<React.ComponentProps<'button'>, 'onChange' | 'value'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

function Switch({ className, checked = false, onCheckedChange, disabled, ...props }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-slot="switch"
      data-state={checked ? 'checked' : 'unchecked'}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-input dark:bg-input/80',
        className,
      )}
      {...props}
    >
      <span
        data-slot="switch-thumb"
        className={cn(
          'bg-background pointer-events-none block size-4 rounded-full ring-0 transition-transform',
          checked ? 'translate-x-[calc(100%-2px)]' : 'translate-x-0',
        )}
      />
    </button>
  );
}

export { Switch };
