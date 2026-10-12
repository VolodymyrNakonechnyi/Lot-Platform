import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { hashPassword, verifyPassword } from '../common/password';
import type { User } from '../db/schema';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';

jest.mock('../common/password');

const hashed = jest.mocked(hashPassword);
const verified = jest.mocked(verifyPassword);

const HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$bm9uY2VfMTZfYnl0ZXM$ZGVyaXZlZEtleQ';

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: '0199a1f0-0000-7000-8000-000000000001',
  username: 'john',
  avatarUrl: null,
  role: 'user',
  password: HASH,
  email: 'john@mail.com',
  confirmedEmail: true,
  name: 'John Doe',
  phoneNumber: '380501112233',
  confirmedPhoneNumber: false,
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  createdAt: new Date('2026-01-01T00:00:00Z'),
  lastLogin: null,
  ...overrides,
});

const registerDto = {
  email: 'john@mail.com',
  password: 'correct horse battery staple',
  name: 'John Doe',
  username: 'john',
  phoneNumber: '380501112233',
};

const loginDto = {
  email: 'john@mail.com',
  password: 'correct horse battery staple',
};

const uniqueViolation = () =>
  Object.assign(new Error('duplicate key value violates unique constraint'), {
    code: '23505',
    constraint: 'users_email_idx',
  });

describe('AuthService', () => {
  let service: AuthService;
  let users: jest.Mocked<Pick<UserService, 'findByEmail' | 'create'>> & {
    update: jest.Mock;
  };

  beforeEach(async () => {
    users = {
      findByEmail: jest.fn().mockResolvedValue(undefined),
      create: jest
        .fn()
        .mockImplementation((data: Partial<User>) =>
          Promise.resolve(makeUser({ ...data, confirmedEmail: false })),
        ),
      update: jest
        .fn()
        .mockImplementation((id: string, data: Partial<User>) =>
          Promise.resolve(makeUser({ ...data, id, confirmedEmail: false })),
        ),
    };

    hashed.mockResolvedValue(HASH);
    verified.mockResolvedValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, { provide: UserService, useValue: users }],
    }).compile();

    service = module.get(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('creates an account when the email is free', async () => {
      await service.register(registerDto);

      expect(users.create).toHaveBeenCalledTimes(1);
      expect(users.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'john@mail.com', password: HASH }),
      );
    });

    it('leaves a new account unconfirmed', async () => {
      const user = await service.register(registerDto);

      expect(user).toEqual(expect.objectContaining({ confirmedEmail: false }));
    });

    it('normalizes the email before the lookup and before storing it', async () => {
      await service.register({ ...registerDto, email: '  John@MAIL.com  ' });

      expect(users.findByEmail).toHaveBeenCalledWith('john@mail.com');
      expect(users.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'john@mail.com' }),
      );
    });

    it('trims the name and collapses inner whitespace', async () => {
      await service.register({ ...registerDto, name: '  John   Doe  ' });

      expect(users.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'John Doe' }),
      );
    });

    it('stores the hash, never the raw password', async () => {
      await service.register(registerDto);

      expect(hashed).toHaveBeenCalledWith(registerDto.password);
      expect(users.create).not.toHaveBeenCalledWith(
        expect.objectContaining({ password: registerDto.password }),
      );
    });

    it('rejects when a confirmed account already owns the email', async () => {
      users.findByEmail.mockResolvedValue(makeUser({ confirmedEmail: true }));

      await expect(service.register(registerDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(users.create).not.toHaveBeenCalled();
      expect(users.update).not.toHaveBeenCalled();
    });

    it('does not hash the password when the email is taken', async () => {
      users.findByEmail.mockResolvedValue(makeUser({ confirmedEmail: true }));

      await expect(service.register(registerDto)).rejects.toThrow();
      expect(hashed).not.toHaveBeenCalled();
    });

    it('overwrites an unconfirmed account instead of creating a second one', async () => {
      const stale = makeUser({
        confirmedEmail: false,
        name: 'Old Name',
        password: 'old-hash',
      });
      users.findByEmail.mockResolvedValue(stale);

      await service.register(registerDto);

      expect(users.create).not.toHaveBeenCalled();
      expect(users.update).toHaveBeenCalledWith(
        stale.id,
        expect.objectContaining({ name: 'John Doe', password: HASH }),
      );
    });

    it('keeps the overwritten account unconfirmed', async () => {
      users.findByEmail.mockResolvedValue(makeUser({ confirmedEmail: false }));

      const user = await service.register(registerDto);

      expect(user).toEqual(expect.objectContaining({ confirmedEmail: false }));
    });

    it('maps a concurrent insert into a conflict', async () => {
      users.create.mockRejectedValue(uniqueViolation());

      await expect(service.register(registerDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('lets an unrelated database error through', async () => {
      users.create.mockRejectedValue(new Error('connection terminated'));

      await expect(service.register(registerDto)).rejects.toThrow(
        'connection terminated',
      );
    });

    it('never returns the password hash', async () => {
      const user = await service.register(registerDto);

      expect(user).not.toHaveProperty('password');
    });
  });

  describe('login', () => {
    beforeEach(() => {
      users.findByEmail.mockResolvedValue(makeUser({ confirmedEmail: true }));
    });

    it('returns the account for valid credentials', async () => {
      const user = await service.login(loginDto);

      expect(user).toEqual(
        expect.objectContaining({ email: 'john@mail.com', username: 'john' }),
      );
    });

    it('normalizes the email before the lookup', async () => {
      await service.login({ ...loginDto, email: '  John@MAIL.com  ' });

      expect(users.findByEmail).toHaveBeenCalledWith('john@mail.com');
    });

    it('checks the password against the stored hash', async () => {
      await service.login(loginDto);

      expect(verified).toHaveBeenCalledWith(HASH, loginDto.password);
    });

    it('rejects an unknown email', async () => {
      users.findByEmail.mockResolvedValue(undefined);

      await expect(service.login(loginDto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('does not verify a password for an unknown email', async () => {
      users.findByEmail.mockResolvedValue(undefined);

      await expect(service.login(loginDto)).rejects.toThrow();
      expect(verified).not.toHaveBeenCalled();
    });

    it('rejects a wrong password', async () => {
      verified.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects an unconfirmed email even with the right password', async () => {
      users.findByEmail.mockResolvedValue(makeUser({ confirmedEmail: false }));

      await expect(service.login(loginDto)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('never returns the password hash', async () => {
      const user = await service.login(loginDto);

      expect(user).not.toHaveProperty('password');
    });
  });
});
