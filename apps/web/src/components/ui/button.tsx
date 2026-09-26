import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { type ComponentProps, forwardRef } from 'react';

import { cn } from '@/lib/cn';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-white shadow-sm hover:bg-brand-dark',
        secondary: 'bg-emerald-50 text-brand-dark hover:bg-emerald-100',
        outline: 'border border-line bg-white text-ink hover:bg-canvas',
        ghost: 'text-ink hover:bg-canvas',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        link: 'text-brand underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3',
        lg: 'h-12 rounded-xl px-6 text-base',
        icon: 'size-10 p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
);

export interface ButtonProps
  extends ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { asChild = false, className, variant, size, type = 'button', ...props },
    ref,
  ) {
    const classNames = cn(buttonVariants({ variant, size }), className);
    if (asChild) return <Slot className={classNames} {...props} />;
    return <button ref={ref} className={classNames} type={type} {...props} />;
  },
);
