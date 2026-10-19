import { randomUUID } from 'node:crypto';
import {
  AuthenticationStorage,
  type SessionRecord,
} from '@nestjs/authentication';
import { eq } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../../db/schema';
import { sessions, users } from '../../db/schema';
import { DrizzleSessionStore } from './drizzle-session.store';

const describeDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeDatabase('DrizzleSessionStore', () => {
  const now = new Date('2026-01-01T00:00:00.000Z');
  const hour = 3_600_000;

  let pool: Pool;
  let db: NodePgDatabase<typeof schema>;
  let store: DrizzleSessionStore;
  let userId: string;

  const record = (overrides: Partial<SessionRecord> = {}): SessionRecord => ({
    id: randomUUID(),
    userId,
    createdAt: now,
    expiresAt: new Date(now.getTime() + hour),
    lastActiveAt: now,
    ...overrides,
  });

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
    db = drizzle(pool, { schema });
    store = new DrizzleSessionStore(db, new AuthenticationStorage());

    const [user] = await db
      .insert(users)
      .values({
        username: `session-store-${randomUUID()}`,
        email: `session-store-${randomUUID()}@example.test`,
        password: 'not-a-real-hash',
        name: 'Session Store',
      })
      .returning();
    userId = user.id;
  });

  afterAll(async () => {
    await db.delete(users).where(eq(users.id, userId));
    await pool.end();
  });

  beforeEach(async () => {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  });

  it('round-trips a session and joins its user, without the password hash', async () => {
    const session = record({ metadata: { ip: '::1' }, mfa: 'verified' });
    await store.createSession(session);

    const stored = await store.getSession(session.id);

    expect(stored).toMatchObject(session);
    expect(stored?.extra?.user.id).toBe(userId);
    expect(stored?.extra?.user).not.toHaveProperty('password');
  });

  it('reads an unknown session as undefined', async () => {
    await expect(store.getSession(randomUUID())).resolves.toBeUndefined();
  });

  it('never recreates a session that was deleted', async () => {
    const session = record();
    await store.createSession(session);
    await store.deleteSession(session.id);

    await store.touchSession(session.id, new Date(now.getTime() + 60_000));

    await expect(store.getSession(session.id)).resolves.toBeUndefined();
  });

  it('moves lastActiveAt forward only', async () => {
    const session = record({ lastActiveAt: new Date(now.getTime() + 60_000) });
    await store.createSession(session);

    await store.touchSession(session.id, now);
    await expect(store.getSession(session.id)).resolves.toMatchObject({
      lastActiveAt: session.lastActiveAt,
    });

    const later = new Date(now.getTime() + 120_000);
    await store.touchSession(session.id, later);
    await expect(store.getSession(session.id)).resolves.toMatchObject({
      lastActiveAt: later,
    });
  });

  it('resolves true in exactly one of four concurrent deletes', async () => {
    const session = record();
    await store.createSession(session);

    const deleted = await Promise.all([
      store.deleteSession(session.id),
      store.deleteSession(session.id),
      store.deleteSession(session.id),
      store.deleteSession(session.id),
    ]);

    expect(deleted.filter(Boolean)).toHaveLength(1);
  });

  it('prunes sessions past their absolute expiry, however long idle', async () => {
    const expired = record({ expiresAt: new Date(now.getTime() - 1) });
    const idle = record({
      lastActiveAt: new Date(now.getTime() - 30 * 24 * hour),
      expiresAt: new Date(now.getTime() + hour),
    });
    await store.createSession(expired);
    await store.createSession(idle);

    await store.createSession(record());

    await expect(store.getSession(expired.id)).resolves.toBeUndefined();
    await expect(store.getSession(idle.id)).resolves.toBeDefined();
  });

  it('lists the user sessions without extra, and deletes them all', async () => {
    const first = record();
    const second = record();
    await store.createSession(first);
    await store.createSession(second);

    const listed = await store.listUserSessions(userId);

    expect(listed.map(({ id }) => id).sort()).toEqual(
      [first.id, second.id].sort(),
    );
    expect(listed.every(({ extra }) => extra === undefined)).toBe(true);

    await store.deleteUserSessions(userId);
    await expect(store.listUserSessions(userId)).resolves.toEqual([]);
  });
});
