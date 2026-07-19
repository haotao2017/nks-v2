'use client';

import * as React from 'react';
import { Check, Minus } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Checkbox —— 依赖无关的受控复选框(与 switch.tsx 同约定)。
 *
 * 说明:项目当前未安装 @radix-ui/react-checkbox(为避免与并行任务争抢依赖安装,
 * 此处用原生 `<button role="checkbox">` 实现),对外 API 与 shadcn/radix 版本一致
 * (checked 支持 true | false | 'indeterminate';onCheckedChange / disabled),
 * 后续若引入 radix 可无痛替换。
 */
export type CheckboxState = boolean | 'indeterminate';

export interface CheckboxProps
  extends Omit<React.ComponentProps<'button'>, 'onChange' | 'value' | 'checked'> {
  checked?: CheckboxState;
  onCheckedChange?: (checked: boolean) => void;
}

function Checkbox({
  className,
  checked = false,
  onCheckedChange,
  disabled,
  ...props
}: CheckboxProps) {
  const isChecked = checked === true;
  const isIndeterminate = checked === 'indeterminate';
  const active = isChecked || isIndeterminate;

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isIndeterminate ? 'mixed' : isChecked}
      data-slot="checkbox"
      data-state={isIndeterminate ? 'indeterminate' : isChecked ? 'checked' : 'unchecked'}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!isChecked)}
      className={cn(
        'focus-visible:border-ring focus-visible:ring-ring/50 border-input inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] border shadow-xs transition-colors outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        active ? 'bg-primary border-primary text-primary-foreground' : 'bg-background',
        className,
      )}
      {...props}
    >
      {isIndeterminate ? (
        <Minus className="size-3.5" strokeWidth={3} />
      ) : isChecked ? (
        <Check className="size-3.5" strokeWidth={3} />
      ) : null}
    </button>
  );
}

export { Checkbox };
