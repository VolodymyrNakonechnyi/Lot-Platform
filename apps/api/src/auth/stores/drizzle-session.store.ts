import { Inject, Injectable } from '@nestjs/common';
import {
  AuthenticationStorage,
  type SessionRecord,
  type SessionStore,
} from '@nestjs/authentication';
import { and, eq, lt, lte } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../../db/db.module';
import { sessions, users, type Session } from '../../db/schema';

@Injectable()
export class DrizzleSessionStore implements SessionStore {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    storage: AuthenticationStorage,
  ) {
    storage.registerSource({ sessions: this });
  }

  async getSession(id: string): Promise<SessionRecord | undefined> {
    const [row] = await this.db
      .select({ session: sessions, user: users })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(eq(sessions.id, id));

    if (!row) return undefined;

    const { password: _password, ...user } = row.user;

    return { ...toRecord(row.session), extra: { user } };
  }

  async createSession(record: SessionRecord): Promise<void> {
    await this.db.insert(sessions).values({
      id: record.id,
      userId: record.userId,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      lastActiveAt: record.lastActiveAt,
      mfa: record.mfa ?? null,
      metadata: record.metadata ?? null,
    });

    await this.db
      .delete(sessions)
      .where(lte(sessions.expiresAt, record.createdAt));
  }

  async touchSession(id: string, lastActiveAt: Date): Promise<void> {
    await this.db
      .update(sessions)
      .set({ lastActiveAt })
      .where(and(eq(sessions.id, id), lt(sessions.lastActiveAt, lastActiveAt)));
  }

  async deleteSession(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(sessions)
      .where(eq(sessions.id, id))
      .returning({ id: sessions.id });

    return deleted.length > 0;
  }

  async listUserSessions(userId: string): Promise<SessionRecord[]> {
    const rows = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId));

    return rows.map(toRecord);
  }

  async deleteUserSessions(userId: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.userId, userId));
  }
}

const toRecord = (row: Session): SessionRecord => ({
  id: row.id,
  userId: row.userId,
  createdAt: row.createdAt,
  expiresAt: row.expiresAt,
  lastActiveAt: row.lastActiveAt,
  ...(row.mfa ? { mfa: row.mfa } : {}),
  ...(row.metadata ? { metadata: row.metadata } : {}),
});
