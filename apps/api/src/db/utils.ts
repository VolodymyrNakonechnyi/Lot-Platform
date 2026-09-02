import { sql, type SQL } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

export function inList(column: AnyPgColumn, values: readonly string[]): SQL {
  return sql`${column} IN (${sql.join(
    values.map((v) => sql`${v}`),
    sql`, `,
  )})`;
}
