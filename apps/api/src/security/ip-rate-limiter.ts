interface WindowState {
  count: number;
  resetAt: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  retryAfterSeconds: number;
}

/**
 * A per-instance fixed-window limiter keyed by the connection's remote IP.
 * State belongs to the limiter instance so separately-created apps (including
 * tests) never share counters.
 */
export class IpRateLimiter {
  private readonly windows = new Map<string, WindowState>();
  private lastNow = Number.NEGATIVE_INFINITY;

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number,
    private readonly maxTrackedIps = 10_000,
    private readonly now: () => number = Date.now,
  ) {
    if (!Number.isInteger(maxRequests) || maxRequests < 1) {
      throw new Error('maxRequests must be a positive integer');
    }
    if (!Number.isFinite(windowMs) || windowMs < 1) {
      throw new Error('windowMs must be a positive number');
    }
    if (!Number.isInteger(maxTrackedIps) || maxTrackedIps < 1) {
      throw new Error('maxTrackedIps must be a positive integer');
    }
  }

  consume(ipAddress: string): RateLimitDecision {
    // Keep window ordering stable if the host wall clock moves backwards.
    const now = Math.max(this.now(), this.lastNow);
    this.lastNow = now;
    this.cleanupExpiredWindows(now);

    const current = this.windows.get(ipAddress);
    if (current && current.resetAt > now) {
      if (current.count >= this.maxRequests) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(
            1,
            Math.ceil((current.resetAt - now) / 1000),
          ),
        };
      }
      current.count += 1;
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (this.windows.size >= this.maxTrackedIps) {
      // Map order follows resetAt, so fail closed for a new IP using the
      // earliest expiry without allocating/scanning every tracked entry.
      const earliestWindow = this.windows.values().next().value as
        | WindowState
        | undefined;
      return {
        allowed: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil(
            ((earliestWindow?.resetAt ?? now + this.windowMs) - now) / 1000,
          ),
        ),
      };
    }

    this.windows.set(ipAddress, {
      count: 1,
      resetAt: now + this.windowMs,
    });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  private cleanupExpiredWindows(now: number): void {
    for (const [ipAddress, window] of this.windows) {
      if (window.resetAt > now) break;
      this.windows.delete(ipAddress);
    }
  }
}
