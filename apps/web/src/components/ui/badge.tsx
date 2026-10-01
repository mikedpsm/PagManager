import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
  {
    variants: {
      variant: {
        default: 'bg-success-soft text-brand-strong',
        paid: 'bg-success-soft text-brand-strong',
        pending: 'bg-warning-soft text-warning',
        overdue: 'bg-danger-soft text-danger',
        neutral: 'bg-canvas text-muted',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends ComponentProps<'span'>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
