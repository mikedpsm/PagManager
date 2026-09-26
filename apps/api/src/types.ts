import type { Db } from '@pagmanager/db';

import type { AppConfig } from './env.js';

export interface SafeUser {
  id: string;
  username: string;
  email: string;
  cpf: string | null;
  phone: string | null;
}

export interface AppEnv {
  Variables: {
    user: SafeUser;
  };
}

export interface AppDeps {
  db: Db;
  env: AppConfig;
}
