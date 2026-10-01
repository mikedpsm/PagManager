import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

// Container builds and source archives do not include Git metadata.
if (!existsSync('.git') || process.env.LEFTHOOK === '0') {
  process.exit(0);
}

const require = createRequire(import.meta.url);
let lefthook;
try {
  lefthook = require.resolve('lefthook/bin/index.js');
} catch (error) {
  // Production installs omit Lefthook along with the other dev dependencies.
  if (error.code === 'MODULE_NOT_FOUND') {
    process.exit(0);
  }
  throw error;
}

const result = spawnSync(process.execPath, [lefthook, 'install'], {
  stdio: 'inherit',
});
if (result.error) {
  throw result.error;
}
process.exit(result.status ?? 1);
