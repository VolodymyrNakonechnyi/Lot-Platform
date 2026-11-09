const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';

type PgError = { code: string; constraint?: string };

function getPgError(error: unknown): PgError | null {
  let current: unknown = error;

  for (let depth = 0; depth < 5; depth++) {
    if (typeof current !== 'object' || current === null) return null;

    if ('code' in current && typeof current.code === 'string') {
      const constraint =
        'constraint' in current && typeof current.constraint === 'string'
          ? current.constraint
          : undefined;

      return { code: current.code, constraint };
    }

    if (!('cause' in current)) return null;

    current = current.cause;
  }

  return null;
}

export function isUniqueViolation(
  error: unknown,
  constraint?: string,
): boolean {
  const pgError = getPgError(error);

  return (
    pgError?.code === UNIQUE_VIOLATION &&
    (constraint === undefined || pgError.constraint === constraint)
  );
}

export function isForeignKeyViolation(
  error: unknown,
  constraint?: string,
): boolean {
  const pgError = getPgError(error);

  return (
    pgError?.code === FOREIGN_KEY_VIOLATION &&
    (constraint === undefined || pgError.constraint === constraint)
  );
}
