import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { normalizeEmail } from '@app/contracts';
import { DRIZZLE, type Database } from '../db/db.module';
import { userIdentities, users, type NewUser, type User } from '../db/schema';

const sameEmail = (email: string) =>
  sql`lower(${users.email}) = ${normalizeEmail(email)}`;

@Injectable()
export class UserService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  findAll(): Promise<User[]> {
    return this.db.select().from(users);
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await this.db.select().from(users).where(sameEmail(email));
    return user;
  }

  async create(data: NewUser): Promise<User> {
    const [user] = await this.db
      .insert(users)
      .values({ ...data, email: normalizeEmail(data.email) })
      .returning();
    return user;
  }

  async update(id: string, data: Partial<NewUser>): Promise<User> {
    const [user] = await this.db
      .update(users)
      .set(data.email ? { ...data, email: normalizeEmail(data.email) } : data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updatePassword(id: string, newPassword: string) {
    await this.db
      .update(users)
      .set({ password: newPassword })
      .where(eq(users.id, id));
  }

  async markEmailVerified(userId: string, email: string): Promise<boolean> {
    const [updated] = await this.db
      .update(users)
      .set({ confirmedEmail: true })
      .where(and(eq(users.id, userId), sameEmail(email)))
      .returning({ id: users.id });

    return updated !== undefined;
  }

  async updateEmail(
    userId: string,
    email: string,
  ): Promise<Pick<User, 'id' | 'email'> | null> {
    const [user] = await this.db
      .update(users)
      .set({ email: email })
      .where(eq(users.id, userId))
      .returning({ id: users.id, email: users.email });

    return user;
  }

  async findByIdentity(
    provider: string,
    subject: string,
  ): Promise<User | null> {
    const [row] = await this.db
      .select({ user: users })
      .from(users)
      .innerJoin(userIdentities, eq(users.id, userIdentities.userId))
      .where(
        and(
          eq(userIdentities.provider, provider),
          eq(userIdentities.subject, subject),
        ),
      );

    return row ? row.user : null;
  }

  async linkIdentity(
    id: string,
    provider: string,
    subject: string,
  ): Promise<User | null> {
    await this.db
      .insert(userIdentities)
      .values({ provider, subject, userId: id });

    return this.findById(id);
  }
}
