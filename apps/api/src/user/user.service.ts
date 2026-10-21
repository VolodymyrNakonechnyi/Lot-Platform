import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { normalizeEmail } from '@app/contracts';
import { DRIZZLE, type Database } from '../db/db.module';
import { users, type NewUser, type User } from '../db/schema';

const sameEmail = (email: string) =>
  sql`lower(${users.email}) = ${normalizeEmail(email)}`;

@Injectable()
export class UserService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  findAll(): Promise<User[]> {
    return this.db.select().from(users);
  }

  async findByEmail(email: string): Promise<User | undefined> {
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

  async updatePassword(email: string, newPassword: string) {
    await this.db
      .update(users)
      .set({ password: newPassword })
      .where(sameEmail(email));
  }

  async markEmailVerified(userId: string, email: string): Promise<boolean> {
    const [updated] = await this.db
      .update(users)
      .set({ confirmedEmail: true })
      .where(and(eq(users.id, userId), sameEmail(email)))
      .returning({ id: users.id });

    return updated !== undefined;
  }
}
