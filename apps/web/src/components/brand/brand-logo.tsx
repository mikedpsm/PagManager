import { cn } from '@/lib/cn';

/** Shared identity; the visible wordmark provides the accessible brand name. */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <img
        src="/brand-mark.svg"
        alt=""
        aria-hidden="true"
        className="size-9 shrink-0"
        width={36}
        height={36}
      />
      <span className="text-lg font-bold tracking-tight text-ink">
        PagManager
      </span>
    </span>
  );
}
