import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it, vi } from 'vitest';

const dirname = path.dirname(fileURLToPath(import.meta.url));

import {
  createShutdownHandler,
  mountStaticAssets,
  resolveStaticDir,
  runHealthcheck,
} from '../src/server.js';

describe('server module', () => {
  it('imports without crashing and exposes the expected helpers', () => {
    expect(typeof resolveStaticDir).toBe('function');
    expect(typeof mountStaticAssets).toBe('function');
    expect(typeof runHealthcheck).toBe('function');
    expect(typeof createShutdownHandler).toBe('function');
  });

  describe('resolveStaticDir', () => {
    it('resolves to a sibling apps/web/dist directory from an arbitrary base dir', () => {
      const base = path.join('some', 'root', 'apps', 'api', 'dist');
      const resolved = resolveStaticDir(base);
      expect(resolved).toBe(path.join('some', 'root', 'apps', 'web', 'dist'));
    });
  });

  describe('mountStaticAssets', () => {
    it('does nothing and returns false when the static directory does not exist', () => {
      const fakeApp = { use: vi.fn(), get: vi.fn() };
      const mounted = mountStaticAssets(
        fakeApp as never,
        path.join('this', 'directory', 'definitely-does-not-exist-12345'),
      );
      expect(mounted).toBe(false);
      expect(fakeApp.use).not.toHaveBeenCalled();
      expect(fakeApp.get).not.toHaveBeenCalled();
    });

    it('mounts compression + static serving + SPA fallback when the directory exists', () => {
      const fakeApp = { use: vi.fn(), get: vi.fn() };
      // apps/api itself always exists on disk, so use it as a stand-in "dist"
      // directory purely to exercise the existsSync(...) === true branch.
      const existingDir = path.join(dirname, '..');
      const mounted = mountStaticAssets(fakeApp as never, existingDir);
      expect(mounted).toBe(true);
      expect(fakeApp.use).toHaveBeenCalledTimes(2);
      expect(fakeApp.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('runHealthcheck', () => {
    it('returns 0 when the fetch resolves with an ok response', async () => {
      const fetchImpl = vi.fn().mockResolvedValue({ ok: true } as Response);
      const code = await runHealthcheck(5000, fetchImpl);
      expect(code).toBe(0);
      expect(fetchImpl).toHaveBeenCalledWith(
        'http://127.0.0.1:5000/health',
        expect.objectContaining({ signal: expect.anything() }),
      );
    });

    it('returns 1 when the fetch resolves with a non-ok response', async () => {
      const fetchImpl = vi.fn().mockResolvedValue({ ok: false } as Response);
      const code = await runHealthcheck(5000, fetchImpl);
      expect(code).toBe(1);
    });

    it('returns 1 when the fetch rejects (connection refused, timeout, etc.)', async () => {
      const fetchImpl = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
      const code = await runHealthcheck(5000, fetchImpl);
      expect(code).toBe(1);
    });
  });

  describe('createShutdownHandler', () => {
    it('closes the server then the db, then exits 0 on clean shutdown', async () => {
      const exit = vi.fn();
      const dbClose = vi.fn().mockResolvedValue(undefined);
      const serverClose = vi.fn((cb: (err?: Error) => void) => cb());

      const shutdown = createShutdownHandler({
        server: { close: serverClose },
        db: { close: dbClose },
        exit,
        log: vi.fn(),
      });

      shutdown('SIGTERM');
      // Let the server.close callback's microtasks (await db.close()) flush.
      await new Promise((resolve) => setImmediate(resolve));

      expect(serverClose).toHaveBeenCalledTimes(1);
      expect(dbClose).toHaveBeenCalledTimes(1);
      expect(exit).toHaveBeenCalledWith(0);
    });

    it('still closes the db and exits 1 if server.close reports an error', async () => {
      const exit = vi.fn();
      const dbClose = vi.fn().mockResolvedValue(undefined);
      const serverClose = vi.fn((cb: (err?: Error) => void) =>
        cb(new Error('boom')),
      );

      const shutdown = createShutdownHandler({
        server: { close: serverClose },
        db: { close: dbClose },
        exit,
        log: vi.fn(),
      });

      shutdown('SIGINT');
      await new Promise((resolve) => setImmediate(resolve));

      expect(dbClose).toHaveBeenCalledTimes(1);
      expect(exit).toHaveBeenCalledWith(1);
    });

    it('force-exits 1 if server.close never calls back before the hard timeout', () => {
      vi.useFakeTimers();
      try {
        const exit = vi.fn();
        const shutdown = createShutdownHandler({
          server: { close: vi.fn() }, // never invokes its callback
          db: { close: vi.fn().mockResolvedValue(undefined) },
          exit,
          log: vi.fn(),
          hardTimeoutMs: 10_000,
        });

        shutdown('SIGTERM');
        expect(exit).not.toHaveBeenCalled();

        vi.advanceTimersByTime(10_001);
        expect(exit).toHaveBeenCalledWith(1);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
