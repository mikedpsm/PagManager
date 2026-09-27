import path from 'node:path';
import { pathToFileURL } from 'node:url';

await import(pathToFileURL(path.join(process.env.API_DIST_DIR, 'server.mjs')));
