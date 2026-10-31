import { Inject, Injectable } from '@nestjs/common';
import {
  AuthenticationStorage,
  type EmailTokenPurpose,
  type EmailTokenRecord,
  type EmailTokenStore,
  type MagicLinkRecord,
  type MagicLinkStore,
  type MfaStore,
  type OidcStateStore,
  type OidcTransaction,
  type RefreshTokenRecord,
  type RefreshTokenStore,
  type SessionRecord,
  type SessionStore,
  type TotpRecord,
} from '@nestjs/authentication';
import { and, desc, eq, gt, isNull, lt, lte, or, sql } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../../db/db.module';
import {
  emailTokens,
  magicLinks,
  mfaAuthenticators,
  mfaFailures,
  mfaRecoveryCodes,
  oidcLogins,
  refreshTokens,
  sessions,
  users,
} from '../../db/schema';

type PendingTable = typeof magicLinks | typeof oidcLogins | typeof emailTokens;

@Injectable()
export class DrizzleAuthenticationStore
  implements
    SessionStore,
    RefreshTokenStore,
    MfaStore,
    MagicLinkStore,
    OidcStateStore,
    EmailTokenStore
{
  protected readonly maxPending: number = 100_000;

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    storage: AuthenticationStorage,
  ) {
    storage.registerSource({
      sessions: this,
      refreshTokens: this,
      mfa: this,
      magicLinks: this,
      oidcStates: this,
      emailTokens: this,
    });
  }

  async getSession(id: string): Promise<SessionRecord | undefined> {
    const [row] = await this.db
      .select({ session: sessions, user: users })
      .from(sessions)
      .leftJoin(users, eq(users.id, sessions.userId))
      .where(eq(sessions.id, id));

    if (!row) {
      return undefined;
    }
    if (!row.user) {
      return withoutNulls(row.session);
    }

    const { password: _password, ...user } = row.user;
    return { ...withoutNulls(row.session), extra: { user } };
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

    return rows.map(withoutNulls);
  }

  async deleteUserSessions(userId: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.userId, userId));
  }

  async getRefreshToken(id: string): Promise<RefreshTokenRecord | undefined> {
    const [row] = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.id, id));

    if (!row) {
      return undefined;
    }

    const { revoked: _revoked, ...token } = row;
    return withoutNulls(token);
  }

  async saveRefreshToken(record: RefreshTokenRecord): Promise<void> {
    await this.db.insert(refreshTokens).values({
      id: record.id,
      familyId: record.familyId,
      userId: record.userId,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      familyExpiresAt: record.familyExpiresAt,
      usedAt: record.usedAt ?? null,
      claims: record.claims ?? null,
    });

    await this.db
      .delete(refreshTokens)
      .where(lte(refreshTokens.familyExpiresAt, record.createdAt));
  }

  async markRefreshTokenUsed(id: string, at: Date): Promise<boolean> {
    const used = await this.db
      .update(refreshTokens)
      .set({ usedAt: at })
      .where(and(eq(refreshTokens.id, id), isNull(refreshTokens.usedAt)))
      .returning({ id: refreshTokens.id });

    return used.length === 1;
  }

  async revokeRefreshTokenFamily(familyId: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.familyId, familyId));
  }

  async isRefreshTokenFamilyRevoked(familyId: string): Promise<boolean> {
    const revoked = await this.db
      .select({ id: refreshTokens.id })
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.familyId, familyId),
          eq(refreshTokens.revoked, true),
        ),
      )
      .limit(1);

    return revoked.length > 0;
  }

  async revokeUserRefreshTokens(userId: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.userId, userId));
  }

  async getTotp(userId: string): Promise<TotpRecord | undefined> {
    const [row] = await this.db
      .select()
      .from(mfaAuthenticators)
      .where(eq(mfaAuthenticators.userId, userId));

    if (!row) {
      return undefined;
    }

    const { userId: _userId, ...totp } = row;
    return withoutNulls(totp);
  }

  async saveTotp(userId: string, record: TotpRecord | null): Promise<void> {
    if (!record) {
      await this.db
        .delete(mfaAuthenticators)
        .where(eq(mfaAuthenticators.userId, userId));
      return;
    }

    const values = {
      secret: record.secret,
      confirmed: record.confirmed,
      pendingSecret: record.pendingSecret ?? null,
    };

    await this.db
      .insert(mfaAuthenticators)
      .values({ userId, ...values, lastUsedStep: record.lastUsedStep ?? null })
      .onConflictDoUpdate({
        target: mfaAuthenticators.userId,
        set: {
          ...values,
          lastUsedStep: sql`greatest(${mfaAuthenticators.lastUsedStep}, excluded.last_used_step)`,
        },
      });
  }

  async claimTotpStep(userId: string, step: number): Promise<boolean> {
    const claimed = await this.db
      .update(mfaAuthenticators)
      .set({ lastUsedStep: step })
      .where(
        and(
          eq(mfaAuthenticators.userId, userId),
          or(
            isNull(mfaAuthenticators.lastUsedStep),
            lt(mfaAuthenticators.lastUsedStep, step),
          ),
        ),
      )
      .returning({ userId: mfaAuthenticators.userId });

    return claimed.length === 1;
  }

  async saveRecoveryCodes(userId: string, hashes: string[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .delete(mfaRecoveryCodes)
        .where(eq(mfaRecoveryCodes.userId, userId));

      if (hashes.length > 0) {
        await tx
          .insert(mfaRecoveryCodes)
          .values(
            [...new Set(hashes)].map((codeHash) => ({ userId, codeHash })),
          );
      }
    });
  }

  async consumeRecoveryCode(userId: string, hash: string): Promise<boolean> {
    const consumed = await this.db
      .delete(mfaRecoveryCodes)
      .where(
        and(
          eq(mfaRecoveryCodes.userId, userId),
          eq(mfaRecoveryCodes.codeHash, hash),
        ),
      )
      .returning({ userId: mfaRecoveryCodes.userId });

    return consumed.length === 1;
  }

  countRecoveryCodes(userId: string): Promise<number> {
    return this.db.$count(
      mfaRecoveryCodes,
      eq(mfaRecoveryCodes.userId, userId),
    );
  }

  async recordMfaFailure(
    userId: string,
    windowMs: number,
    now: number,
  ): Promise<number> {
    await this.db
      .insert(mfaFailures)
      .values({ userId, failedAt: new Date(now) });

    const failures = await this.countMfaFailures(userId, windowMs, now);

    await this.db
      .delete(mfaFailures)
      .where(lte(mfaFailures.failedAt, new Date(now - windowMs)));

    return failures;
  }

  countMfaFailures(
    userId: string,
    windowMs: number,
    now: number,
  ): Promise<number> {
    return this.db.$count(
      mfaFailures,
      and(
        eq(mfaFailures.userId, userId),
        gt(mfaFailures.failedAt, new Date(now - windowMs)),
      ),
    );
  }

  async clearMfaFailures(userId: string): Promise<void> {
    await this.db.delete(mfaFailures).where(eq(mfaFailures.userId, userId));
  }

  async saveMagicLink(record: MagicLinkRecord): Promise<void> {
    await this.db.insert(magicLinks).values({
      id: record.id,
      email: record.email,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      redirectTo: record.redirectTo ?? null,
    });

    await this.trim(magicLinks, record.createdAt);
  }

  async consumeMagicLink(id: string): Promise<MagicLinkRecord | undefined> {
    const [row] = await this.db
      .delete(magicLinks)
      .where(eq(magicLinks.id, id))
      .returning();

    return row && withoutNulls(row);
  }

  async saveOidcState({ link, ...login }: OidcTransaction): Promise<void> {
    await this.db.insert(oidcLogins).values({
      state: login.state,
      provider: login.provider,
      codeVerifier: login.codeVerifier,
      nonce: login.nonce ?? null,
      redirectTo: login.redirectTo ?? null,
      linkUserId: link?.userId ?? null,
      linkSessionId: link?.sessionId ?? null,
      createdAt: login.createdAt,
      expiresAt: login.expiresAt,
    });

    await this.trim(oidcLogins, login.createdAt);
  }

  async consumeOidcState(state: string): Promise<OidcTransaction | undefined> {
    const [row] = await this.db
      .delete(oidcLogins)
      .where(eq(oidcLogins.state, state))
      .returning();

    if (!row) {
      return undefined;
    }

    const { linkUserId, linkSessionId, ...login } = withoutNulls(row);
    return linkUserId && linkSessionId
      ? { ...login, link: { userId: linkUserId, sessionId: linkSessionId } }
      : login;
  }

  async saveEmailToken(record: EmailTokenRecord): Promise<void> {
    await this.db.insert(emailTokens).values({
      id: record.id,
      purpose: record.purpose,
      userId: record.userId,
      email: record.email,
      fingerprint: record.fingerprint ?? null,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
    });

    await this.trim(emailTokens, record.createdAt);
  }

  async consumeEmailToken(
    id: string,
    purpose: EmailTokenPurpose,
  ): Promise<EmailTokenRecord | undefined> {
    const [row] = await this.db
      .delete(emailTokens)
      .where(and(eq(emailTokens.id, id), eq(emailTokens.purpose, purpose)))
      .returning();

    return row && withoutNulls(row);
  }

  async deleteUserEmailTokens(
    userId: string,
    purpose: EmailTokenPurpose,
  ): Promise<void> {
    await this.db
      .delete(emailTokens)
      .where(
        and(eq(emailTokens.userId, userId), eq(emailTokens.purpose, purpose)),
      );
  }

  private async trim(table: PendingTable, now: Date): Promise<void> {
    await this.db.delete(table).where(lte(table.expiresAt, now));

    const [cutoff] = await this.db
      .select({ expiresAt: table.expiresAt })
      .from(table)
      .orderBy(desc(table.expiresAt))
      .limit(1)
      .offset(this.maxPending);

    if (cutoff) {
      await this.db.delete(table).where(lte(table.expiresAt, cutoff.expiresAt));
    }
  }
}

type WithoutNulls<T> = {
  [K in keyof T as null extends T[K] ? never : K]: T[K];
} & {
  [K in keyof T as null extends T[K] ? K : never]?: Exclude<T[K], null>;
};

function withoutNulls<T extends object>(row: T): WithoutNulls<T> {
  return Object.fromEntries(
    Object.entries(row).filter(([, value]) => value !== null),
  ) as WithoutNulls<T>;
}
