import type { Db, Schema } from '@pagmanager/db';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';

/**
 * `Db['client']` is a union of `PostgresJsDatabase<Schema>` and
 * `PgliteDatabase<Schema>`. TypeScript cannot resolve overloaded methods
 * (like `.returning(fields)`) called through a union of two classes that
 * each override that overload set differently, even though both are
 * ultimately just a `PgDatabase` with a different query-result HKT. This
 * helper gives call sites a single, unified type to chain query builder
 * calls (including `.returning()`) against, without needing `any` at every
 * call site.
 */
export function client(db: Db): PgDatabase<PgQueryResultHKT, Schema> {
  return db.client as unknown as PgDatabase<PgQueryResultHKT, Schema>;
}
