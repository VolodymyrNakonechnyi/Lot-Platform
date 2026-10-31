import { join } from 'node:path';
import { AuthenticationStorage } from '@nestjs/authentication';
import { authenticationStoreContract } from '@nestjs/authentication/testing';
import { eq, sql } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as schema from '../../db/schema';
import { sessions, users } from '../../db/schema';
import { DrizzleAuthenticationStore } from './drizzle-authentication.store';

type Database = NodePgDatabase<typeof schema>;

const DATABASE = 'bullmq_store_contract';
const MAX_PENDING = 3;

class CappedStore extends DrizzleAuthenticationStore {
  protected override readonly maxPending = MAX_PENDING;
}

let db: Database;
let pool: Pool;

async function emptyStore() {
  await db.execute(
    sql`TRUNCATE sessions, refresh_tokens, mfa_authenticators, mfa_recovery_codes, mfa_failures, magic_links, oidc_logins, email_tokens`,
  );

  const store = new CappedStore(db, new AuthenticationStorage());
  return {
    sessions: store,
    refreshTokens: store,
    mfa: store,
    magicLinks: store,
    oidcStates: store,
    emailTokens: store,
  };
}

const describeDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeDatabase('DrizzleAuthenticationStore', () => {
  jest.setTimeout(120_000);

  beforeAll(async () => {
    const admin = new Pool({ connectionString: process.env.DATABASE_URL });
    await admin.query(`DROP DATABASE IF EXISTS ${DATABASE} WITH (FORCE)`);
    await admin.query(`CREATE DATABASE ${DATABASE}`);
    await admin.end();

    const url = new URL(process.env.DATABASE_URL!);
    url.pathname = `/${DATABASE}`;
    pool = new Pool({ connectionString: url.toString(), max: 10 });
    db = drizzle(pool, { schema });

    await migrate(db, {
      migrationsFolder: join(__dirname, '..', '..', '..', 'drizzle'),
    });

    await db.execute(sql`
      DO $$
      DECLARE target record;
      BEGIN
        FOR target IN
          SELECT conrelid::regclass AS table_name, conname
          FROM pg_constraint
          WHERE contype = 'f' AND confrelid = 'users'::regclass
        LOOP
          EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', target.table_name, target.conname);
        END LOOP;

        ALTER TABLE users ALTER COLUMN id DROP DEFAULT;
        ALTER TABLE users ALTER COLUMN id TYPE text;

        FOR target IN
          SELECT table_name, column_name
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND column_name IN ('user_id', 'link_user_id')
            AND data_type = 'uuid'
        LOOP
          EXECUTE format('ALTER TABLE %I ALTER COLUMN %I TYPE text', target.table_name, target.column_name);
        END LOOP;
      END $$;
    `);
  });

  afterAll(async () => {
    await pool?.end();
  });

  for (const contractCase of authenticationStoreContract(emptyStore, {
    concurrent: true,
    maxPending: MAX_PENDING,
  })) {
    it(contractCase.name, () => contractCase.run());
  }

  it('reads the session user as extra, without the password hash', async () => {
    const store = (await emptyStore()).sessions;
    const [user] = await db
      .insert(users)
      .values({
        id: 'contract-user',
        email: 'contract@example.com',
        password: 'hashed',
      })
      .returning();

    const now = new Date();
    await store.createSession({
      id: 'contract-session',
      userId: user.id,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 3_600_000),
      lastActiveAt: now,
    });

    const found = await store.getSession('contract-session');
    expect(found?.extra?.user).toMatchObject({ email: 'contract@example.com' });
    expect(found?.extra?.user).not.toHaveProperty('password');

    const [listed] = await store.listUserSessions(user.id);
    expect(listed.extra).toBeUndefined();

    await db.delete(users).where(eq(users.id, user.id));
    const orphan = await store.getSession('contract-session');
    expect(orphan?.extra).toBeUndefined();
    await db.delete(sessions).where(eq(sessions.id, 'contract-session'));
  });
});
