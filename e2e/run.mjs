import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const e2eDir = mkdtempSync(path.join(tmpdir(), 'pagmanager-e2e-'));
const apiBuildDir = mkdtempSync(
  path.join(rootDir, 'apps', 'api', '.e2e-api-dist-'),
);
const port = 41_000 + Math.floor(Math.random() * 4_000);
const env = {
  ...process.env,
  NODE_ENV: 'test',
  PORT: String(port),
  DATA_DIR: path.join(e2eDir, 'data'),
  API_DIST_DIR: apiBuildDir,
  WEB_DIST_DIR: path.join(e2eDir, 'web'),
  JWT_SECRET: 'phase-6-playwright-test-secret',
  PAGMANAGER_E2E_BASE_URL: `http://127.0.0.1:${port}`,
};
delete env.DATABASE_URL;

function runPnpm(args) {
  const result = spawnSync('pnpm', args, {
    cwd: rootDir,
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

let exitCode = 1;
let server;
try {
  exitCode = runPnpm(['build']);
  if (exitCode === 0) {
    if (process.platform === 'win32') {
      server = spawn(process.execPath, [path.join(rootDir, 'e2e/server.mjs')], {
        cwd: rootDir,
        env,
        stdio: 'inherit',
        windowsHide: true,
      });

      const serverExited = new Promise((resolve) => {
        server.once('exit', (code) => resolve(code ?? 1));
      });
      let ready = false;
      for (let attempt = 0; attempt < 120; attempt += 1) {
        const result = await Promise.race([
          fetch(`${env.PAGMANAGER_E2E_BASE_URL}/health`)
            .then((response) => response.ok)
            .catch(() => false),
          serverExited.then(() => false),
        ]);
        if (result) {
          ready = true;
          break;
        }
        if (server.exitCode !== null) break;
        await delay(250);
      }

      if (!ready) {
        console.error('The temporary E2E server did not become ready.');
        exitCode = 1;
      }
    }
    if (exitCode === 0) exitCode = runPnpm(['exec', 'playwright', 'test']);
  }
} finally {
  if (server && server.exitCode === null) {
    server.kill('SIGTERM');
    await Promise.race([serverExitedPromise(server), delay(5_000)]);
  }
  try {
    rmSync(e2eDir, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 500,
    });
  } catch (error) {
    console.error(`Could not remove temporary E2E directory ${e2eDir}:`, error);
    if (exitCode === 0) exitCode = 1;
  }
  try {
    rmSync(apiBuildDir, { recursive: true, force: true });
  } catch (error) {
    console.error(
      `Could not remove temporary API build directory ${apiBuildDir}:`,
      error,
    );
    if (exitCode === 0) exitCode = 1;
  }
}

process.exitCode = exitCode;

function serverExitedPromise(child) {
  if (child.exitCode !== null) return Promise.resolve();
  return new Promise((resolve) => child.once('exit', resolve));
}
