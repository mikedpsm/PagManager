import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { initializeDb, type Db } from '@pagmanager/db';
import { compress } from 'hono/compress';

import { createApp } from './app.js';
import { loadEnv } from './env.js';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Resolves the directory the SPA build output (from `apps/web`, Phase 5)
 * would live in, relative to wherever this module physically runs from
 * (either `apps/api/src` under `tsx`, or `apps/api/dist` after a build).
 *
 * Both locations sit two levels below `apps/`, so `../../web/dist` from
 * either resolves to the sibling `apps/web/dist` directory.
 */
export function resolveStaticDir(baseDir: string = moduleDir): string {
  return path.join(baseDir, '../../web/dist');
}

const API_ONLY_PATH_PREFIXES = ['/api', '/health', '/docs', '/openapi.json'];

function isApiOnlyPath(pathname: string): boolean {
  return API_ONLY_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

let staticSkipLogged = false;

/**
 * Mounts compressed static file serving + SPA fallback for the built
 * frontend, if it exists on disk. This is a no-op (with a one-time log
 * message) when `apps/web` hasn't been built yet - the API must keep
 * working without a frontend bundle present.
 */
export function mountStaticAssets(
  app: ReturnType<typeof createApp>,
  staticDir: string = resolveStaticDir(),
): boolean {
  if (!existsSync(staticDir)) {
    if (!staticSkipLogged) {
      console.log(
        `[server] Static assets directory not found at "${staticDir}" - skipping static file serving (expected until apps/web is built).`,
      );
      staticSkipLogged = true;
    }
    return false;
  }

  app.use('*', compress());
  app.use('/*', serveStatic({ root: staticDir }));

  app.get('*', (c, next) => {
    if (isApiOnlyPath(new URL(c.req.url).pathname)) {
      return next();
    }
    return serveStatic({ root: staticDir, path: 'index.html' })(c, next);
  });

  return true;
}

/**
 * Probes an already-running instance's `/health` endpoint and returns a
 * process exit code (0 = healthy, 1 = anything else), mirroring the Docker
 * `HEALTHCHECK CMD` pattern. Never throws.
 */
export async function runHealthcheck(
  port: number,
  fetchImpl: typeof fetch = fetch,
): Promise<0 | 1> {
  try {
    const res = await fetchImpl(`http://127.0.0.1:${port}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok ? 0 : 1;
  } catch {
    return 1;
  }
}

export interface ShutdownDeps {
  server: { close: (cb: (err?: Error) => void) => void };
  db: Pick<Db, 'close'>;
  exit?: (code: number) => void;
  log?: (...args: unknown[]) => void;
  hardTimeoutMs?: number;
}

/**
 * Creates a handler that gracefully stops accepting new connections, closes
 * the DB connection, and exits - with a hard timeout fallback in case
 * `server.close()` never calls back (e.g. long-lived open connections).
 */
export function createShutdownHandler(deps: ShutdownDeps) {
  const exit = deps.exit ?? process.exit.bind(process);
  const log = deps.log ?? console.log.bind(console);
  const hardTimeoutMs = deps.hardTimeoutMs ?? 10_000;

  return function shutdown(signal: string) {
    log(`[server] Received ${signal}, shutting down gracefully...`);

    const hardTimeout = setTimeout(() => {
      log('[server] Graceful shutdown timed out, forcing exit.');
      exit(1);
    }, hardTimeoutMs);
    hardTimeout.unref?.();

    deps.server.close(async (closeErr) => {
      if (closeErr) {
        log('[server] Error while closing HTTP server:', closeErr);
      }
      try {
        await deps.db.close();
      } catch (dbErr) {
        log('[server] Error while closing DB connection:', dbErr);
      } finally {
        clearTimeout(hardTimeout);
        exit(closeErr ? 1 : 0);
      }
    });
  };
}

async function healthcheckMain(): Promise<void> {
  const env = await loadEnv();
  const code = await runHealthcheck(env.port);
  // Prefer `process.exitCode` over a forced `process.exit()` right after an
  // in-flight `fetch()` - on Windows, exiting immediately while undici still
  // has internal handles closing can crash the process with a libuv
  // assertion failure (nodejs/node#64322). Setting the exit code and letting
  // the event loop drain naturally is the safer, still-correct-for-Docker-
  // HEALTHCHECK approach and behaves the same on Linux/macOS.
  process.exitCode = code;
}

async function main(): Promise<void> {
  const env = await loadEnv();
  const db = await initializeDb({
    DATABASE_URL: env.databaseUrl,
    DATA_DIR: env.dataDir,
  });

  const app = createApp({ db, env });
  mountStaticAssets(app);

  const server = serve({ fetch: app.fetch, port: env.port }, (info) => {
    console.log(`PagManager API listening on http://localhost:${info.port}`);
  });

  const shutdown = createShutdownHandler({ server, db });
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

if (process.argv.includes('--healthcheck')) {
  healthcheckMain();
} else {
  main().catch((error) => {
    console.error('Failed to start PagManager API:', error);
    process.exit(1);
  });
}
