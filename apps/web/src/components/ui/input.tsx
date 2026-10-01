import { type ComponentProps, forwardRef, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

export const Input = forwardRef<HTMLInputElement, ComponentProps<'input'>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'flex h-11 w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-sm text-ink shadow-sm transition placeholder:text-muted/70 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger aria-invalid:ring-2 aria-invalid:ring-danger/10',
          className,
        )}
        {...props}
      />
    );
  },
);

export function FieldLabel({ className, ...props }: ComponentProps<'label'>) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: Each caller supplies htmlFor for its matching field.
    <label
      className={cn('mb-1.5 block text-sm font-medium text-ink', className)}
      {...props}
    />
  );
}

export function FieldError({ children }: { children?: ReactNode }) {
  return children ? (
    <p role="alert" className="mt-1.5 text-xs font-medium text-danger">
      {children}
    </p>
  ) : null;
}
