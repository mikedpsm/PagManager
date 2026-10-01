import { describe, expect, it } from 'vitest';

import { IpRateLimiter } from '../../src/security/ip-rate-limiter.js';

describe('IpRateLimiter', () => {
  it('limits each IP independently and recovers after the fixed window', () => {
    let now = 1_000;
    const limiter = new IpRateLimiter(2, 10_000, 10, () => now);

    expect(limiter.consume('192.0.2.1')).toEqual({
      allowed: true,
      retryAfterSeconds: 0,
    });
    expect(limiter.consume('192.0.2.1').allowed).toBe(true);
    expect(limiter.consume('192.0.2.1')).toEqual({
      allowed: false,
      retryAfterSeconds: 10,
    });
    expect(limiter.consume('192.0.2.2').allowed).toBe(true);

    now += 10_000;
    expect(limiter.consume('192.0.2.1').allowed).toBe(true);
  });

  it('keeps the number of tracked IPs bounded and fails closed at capacity', () => {
    let now = 5_000;
    const limiter = new IpRateLimiter(1, 2_000, 1, () => now);

    expect(limiter.consume('192.0.2.1').allowed).toBe(true);
    expect(limiter.consume('192.0.2.2')).toEqual({
      allowed: false,
      retryAfterSeconds: 2,
    });

    now += 2_000;
    expect(limiter.consume('192.0.2.2').allowed).toBe(true);
  });

  it('checks only the earliest expiry when serving a full limiter', () => {
    const capacity = 1_000;
    const limiter = new IpRateLimiter(2, 10_000, capacity, () => 5_000);
    for (let index = 0; index < capacity; index += 1) {
      expect(limiter.consume(`192.0.2.${index}`).allowed).toBe(true);
    }

    const windows = (
      limiter as unknown as {
        windows: Map<string, { count: number; resetAt: number }>;
      }
    ).windows;
    const originalIterator = windows[Symbol.iterator].bind(windows);
    let traversedEntries = 0;
    Object.defineProperty(windows, Symbol.iterator, {
      configurable: true,
      value: function* () {
        for (const entry of originalIterator()) {
          traversedEntries += 1;
          yield entry;
        }
      },
    });

    expect(limiter.consume('192.0.2.0').allowed).toBe(true);
    expect(traversedEntries).toBe(1);

    traversedEntries = 0;
    expect(limiter.consume('192.0.2.1000')).toMatchObject({
      allowed: false,
      retryAfterSeconds: 10,
    });
    expect(traversedEntries).toBe(1);
  });

  it('does not share counters between limiter instances', () => {
    let now = 1_000;
    const first = new IpRateLimiter(1, 10_000, 10, () => now);
    const second = new IpRateLimiter(1, 10_000, 10, () => now);

    expect(first.consume('192.0.2.1').allowed).toBe(true);
    expect(first.consume('192.0.2.1').allowed).toBe(false);
    expect(second.consume('192.0.2.1').allowed).toBe(true);

    now += 10_000;
    expect(first.consume('192.0.2.1').allowed).toBe(true);
  });
});
