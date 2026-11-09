import {
  BadRequestException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DrizzleError, DrizzleQueryError } from 'drizzle-orm';
import { DatabaseError } from 'pg';

export type DbErrorInfo = { message: string; constraint: string | null };

type ErrorHandler = (error: DatabaseError) => DbErrorInfo;

const PostgresErrorHandlers: Record<string, ErrorHandler> = {
  '23505': (error) => ({
    message: 'A duplicate entry was found for a unique field.',
    constraint: error.constraint || null,
  }),
  '23503': (error) => ({
    message:
      'A foreign key violation occurred. The record you are trying to link does not exist.',
    constraint: error.constraint || null,
  }),
  '22P02': () => ({
    message:
      'The data provided is in an invalid format (e.g., not a valid UUID).',
    constraint: null,
  }),
  '23514': (error) => ({
    message: 'A check constraint was violated.',
    constraint: error.constraint || null,
  }),
  '23502': (error) => ({
    message: `A required field is missing. The column '${error.column}' cannot be null.`,
    constraint: error.column || null,
  }),
  '42703': (error) => ({
    message: 'An undefined column was referenced in the query.',
    constraint: error.column || null,
  }),
  '42601': () => ({
    message: "There's a syntax error in the database query.",
    constraint: null,
  }),
  '25000': () => ({
    message:
      'Transaction failed: a data integrity issue occurred within a database transaction.',
    constraint: null,
  }),
  '08006': () => ({
    message: 'Database connection failed. The database may be unavailable.',
    constraint: null,
  }),
  '42P01': () => ({
    message: 'A referenced table does not exist in the database.',
    constraint: null,
  }),
  '40001': () => ({
    message:
      'Transaction serialization failure. Please retry the transaction as it could not be completed due to concurrent modifications.',
    constraint: null,
  }),
  default: (error) => ({
    message: `A database error occurred: ${error.message}`,
    constraint: null,
  }),
};

export const PG_ERROR = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  CHECK_VIOLATION: '23514',
  INVALID_TEXT_REPRESENTATION: '22P02',
  SERIALIZATION_FAILURE: '40001',
} as const;

export function getDatabaseError(error: unknown): DatabaseError | null {
  if (error instanceof DatabaseError) {
    return error;
  }

  if (
    error instanceof DrizzleQueryError &&
    error.cause instanceof DatabaseError
  ) {
    return error.cause;
  }

  return null;
}

function matches(error: unknown, code: string, constraint?: string): boolean {
  const dbError = getDatabaseError(error);

  if (dbError?.code !== code) {
    return false;
  }

  return constraint === undefined || dbError.constraint === constraint;
}

export const isUniqueViolation = (error: unknown, constraint?: string) =>
  matches(error, PG_ERROR.UNIQUE_VIOLATION, constraint);

export const isForeignKeyViolation = (error: unknown, constraint?: string) =>
  matches(error, PG_ERROR.FOREIGN_KEY_VIOLATION, constraint);

export const isCheckViolation = (error: unknown, constraint?: string) =>
  matches(error, PG_ERROR.CHECK_VIOLATION, constraint);

export const isNotNullViolation = (error: unknown, column?: string) => {
  const dbError = getDatabaseError(error);

  return (
    dbError?.code === PG_ERROR.NOT_NULL_VIOLATION &&
    (column === undefined || dbError.column === column)
  );
};

export const isSerializationFailure = (error: unknown) =>
  matches(error, PG_ERROR.SERIALIZATION_FAILURE);

const KEY_DETAIL = /^Key \((?<columns>[^)]+)\)=\((?<values>.+)\)/;

function describeKey(dbError: DatabaseError): string | null {
  const groups = KEY_DETAIL.exec(dbError.detail ?? '')?.groups;

  return groups ? `${groups.columns} "${groups.values}"` : null;
}

export function toHttpError(error: unknown): unknown {
  if (error instanceof HttpException) {
    return error;
  }

  const dbError = getDatabaseError(error);

  if (!dbError) {
    return error;
  }

  const key = describeKey(dbError);

  switch (dbError.code) {
    case PG_ERROR.UNIQUE_VIOLATION:
      return new ConflictException(
        key ? `${key} is already taken` : 'A unique field is already taken',
      );

    case PG_ERROR.FOREIGN_KEY_VIOLATION:
      return new BadRequestException(
        key ? `${key} does not exist` : 'A referenced record does not exist',
      );

    case PG_ERROR.NOT_NULL_VIOLATION:
      return new BadRequestException(
        `${dbError.column ?? 'A field'} is required`,
      );

    case PG_ERROR.CHECK_VIOLATION:
      return new BadRequestException(
        dbError.constraint
          ? `Value rejected by ${dbError.constraint}`
          : 'A value was rejected by the database',
      );

    case PG_ERROR.INVALID_TEXT_REPRESENTATION:
      return new BadRequestException('A value has an invalid format');

    case PG_ERROR.SERIALIZATION_FAILURE:
      return new ServiceUnavailableException('Please retry the request');

    default:
      return new InternalServerErrorException(getDbErrorMessage(error).message);
  }
}

export function getDbErrorMessage(error: unknown): DbErrorInfo {
  if (
    error instanceof DrizzleQueryError &&
    error.cause instanceof DatabaseError
  ) {
    const originalError = error.cause;
    const handler = PostgresErrorHandlers[originalError.code ?? 'default'];

    if (handler) {
      return handler(originalError);
    }

    return {
      message: `A database error occurred: ${originalError.message}`,
      constraint: null,
    };
  }

  if (error instanceof DrizzleError || error instanceof Error) {
    return {
      message: error.message || 'An unexpected error occurred.',
      constraint: null,
    };
  }

  return { message: 'An unknown error occurred.', constraint: null };
}
