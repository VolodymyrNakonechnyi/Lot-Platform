import { INestApplication, StandardSchemaValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
  EmailVerificationService,
  MfaService,
  PasswordResetService,
  SignInService,
  TokenService,
} from '@nestjs/authentication';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AuthController } from '../src/auth/auth.controller';
import { CredentialsService } from '../src/auth/credentials.service';
import { EmailVerificationController } from '../src/auth/email-verification.controller';
import { MfaController } from '../src/auth/mfa.controller';
import { PasswordResetController } from '../src/auth/password-reset.controller';
import { TokensController } from '../src/auth/token.controller';
import { MeController } from '../src/user/me.controller';
import { UserService } from '../src/user/user.service';

const user = { id: 'u1', email: 'user@example.com', name: 'Ada Lovelace' };

const credentials = { register: jest.fn(), verify: jest.fn() };
const signIn = {
  signIn: jest.fn(),
  confirmMfa: jest.fn(),
  completeMfa: jest.fn(),
};
const emailVerification = { send: jest.fn(), verify: jest.fn() };
const passwordReset = { request: jest.fn(), reset: jest.fn() };
const tokens = { issue: jest.fn(), refresh: jest.fn() };
const mfa = { enroll: jest.fn(), generateRecoveryCodes: jest.fn() };
const users = { findByEmail: jest.fn(), updateEmail: jest.fn() };

function issues(body: unknown): string[] {
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const { message } = body;
    return Array.isArray(message) ? message.map(String) : [String(message)];
  }
  return [];
}

describe('Request validation (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const fixture: TestingModule = await Test.createTestingModule({
      controllers: [
        AuthController,
        EmailVerificationController,
        MeController,
        MfaController,
        PasswordResetController,
        TokensController,
      ],
      providers: [
        { provide: APP_PIPE, useClass: StandardSchemaValidationPipe },
        { provide: CredentialsService, useValue: credentials },
        { provide: SignInService, useValue: signIn },
        { provide: EmailVerificationService, useValue: emailVerification },
        { provide: PasswordResetService, useValue: passwordReset },
        { provide: TokenService, useValue: tokens },
        { provide: MfaService, useValue: mfa },
        { provide: UserService, useValue: users },
      ],
    }).compile();

    app = fixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    credentials.register.mockResolvedValue(user);
    credentials.verify.mockResolvedValue(user);
    signIn.signIn.mockResolvedValue({ session: { mfa: 'none' } });
    signIn.confirmMfa.mockResolvedValue(true);
    signIn.completeMfa.mockResolvedValue({ session: { mfa: 'verified' } });
    emailVerification.send.mockResolvedValue(undefined);
    emailVerification.verify.mockResolvedValue({ email: user.email });
    passwordReset.reset.mockResolvedValue({ signedIn: { session: {} } });
    tokens.issue.mockResolvedValue({ accessToken: 'a', expiresIn: 900 });
    tokens.refresh.mockResolvedValue({ accessToken: 'a', refreshToken: 'b' });
    mfa.generateRecoveryCodes.mockResolvedValue(['code-1']);
    users.findByEmail.mockResolvedValue(undefined);
    users.updateEmail.mockResolvedValue(user);
  });

  describe('POST /auth/sign-up', () => {
    it('answers 400 with one issue per broken field', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ email: 'nope', password: 'short', name: '  ' });

      expect(res.status).toBe(400);
      expect(issues(res.body)).toEqual([
        'email: invalid_email',
        'password: password_too_short',
        'password: password_needs_digit',
        'name: name_required',
      ]);
      expect(credentials.register).not.toHaveBeenCalled();
    });

    it('rejects keys the schema does not declare', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({
          email: 'user@example.com',
          password: 'longenough1',
          name: 'Ada',
          role: 'admin',
        });

      expect(res.status).toBe(400);
      expect(issues(res.body)[0]).toMatch(/Unrecognized key/);
      expect(credentials.register).not.toHaveBeenCalled();
    });

    it('hands the handler the normalized email and name', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({
          email: '  Ada.Lovelace+Bull@Example.COM ',
          password: 'longenough1',
          name: '  Ada   Lovelace ',
        });

      expect(res.status).toBe(201);
      expect(credentials.register).toHaveBeenCalledWith(
        'ada.lovelace+bull@example.com',
        'Ada Lovelace',
        'longenough1',
      );
    });
  });

  describe('POST /auth/sign-in', () => {
    it('requires a password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({ email: 'user@example.com' });

      expect(res.status).toBe(400);
      expect(issues(res.body)[0]).toMatch(/^password:/);
      expect(credentials.verify).not.toHaveBeenCalled();
    });

    it('rejects an empty password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({ email: 'user@example.com', password: '' });

      expect(res.status).toBe(400);
      expect(issues(res.body)).toEqual(['password: password_required']);
      expect(credentials.verify).not.toHaveBeenCalled();
    });

    it('leaves any non-empty password to the credentials check', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({ email: 'user@example.com', password: 'ebal' });

      expect(res.status).toBe(200);
      expect(credentials.verify).toHaveBeenCalledWith(
        'user@example.com',
        'ebal',
      );
    });
  });

  describe('POST /auth/token', () => {
    it('reports both missing credentials at once', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/token')
        .send({});

      expect(res.status).toBe(400);
      expect(issues(res.body)).toHaveLength(2);
      expect(tokens.issue).not.toHaveBeenCalled();
    });

    it('passes a TOTP code on as the second factor', async () => {
      const res = await request(app.getHttpServer()).post('/auth/token').send({
        email: 'user@example.com',
        password: 'longenough1',
        code: ' 12 34 56 ',
      });

      expect(res.status).toBe(200);
      expect(tokens.issue).toHaveBeenCalledWith('u1', {
        method: 'password',
        claims: { amr: ['pwd'] },
        secondFactor: { code: '123456', recoveryCode: undefined },
      });
    });

    it('passes a recovery code on as the second factor', async () => {
      const res = await request(app.getHttpServer()).post('/auth/token').send({
        email: 'user@example.com',
        password: 'longenough1',
        recoveryCode: 'paper-code',
      });

      expect(res.status).toBe(200);
      expect(tokens.issue).toHaveBeenCalledWith('u1', {
        method: 'password',
        claims: { amr: ['pwd'] },
        secondFactor: { code: undefined, recoveryCode: 'paper-code' },
      });
    });

    it('issues tokens without a code, so the app can learn it needs one', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/token')
        .send({ email: 'user@example.com', password: 'longenough1' });

      expect(res.status).toBe(200);
      expect(tokens.issue).toHaveBeenCalledWith('u1', {
        method: 'password',
        claims: { amr: ['pwd'] },
        secondFactor: { code: undefined, recoveryCode: undefined },
      });
    });

    it('rejects a code that is not six digits', async () => {
      const res = await request(app.getHttpServer()).post('/auth/token').send({
        email: 'user@example.com',
        password: 'longenough1',
        code: '1234',
      });

      expect(res.status).toBe(400);
      expect(issues(res.body)).toEqual(['code: invalid_code']);
      expect(tokens.issue).not.toHaveBeenCalled();
    });

    it('stays strict about keys after extending the sign-in schema', async () => {
      const res = await request(app.getHttpServer()).post('/auth/token').send({
        email: 'user@example.com',
        password: 'longenough1',
        totp: '123456',
      });

      expect(res.status).toBe(400);
      expect(issues(res.body)[0]).toMatch(/Unrecognized key/);
      expect(tokens.issue).not.toHaveBeenCalled();
    });
  });

  describe('POST /auth/token/refresh', () => {
    it('requires a refresh token instead of spending undefined', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/token/refresh')
        .send({});

      expect(res.status).toBe(400);
      expect(issues(res.body)[0]).toMatch(/^refreshToken:/);
      expect(tokens.refresh).not.toHaveBeenCalled();
    });

    it('forwards the token it was given', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/token/refresh')
        .send({ refreshToken: 'opaque-token' });

      expect(res.status).toBe(200);
      expect(tokens.refresh).toHaveBeenCalledWith('opaque-token');
    });
  });

  describe('POST /auth/password/forgot', () => {
    it('rejects a malformed address', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/password/forgot')
        .send({ email: 'bad' });

      expect(res.status).toBe(400);
      expect(issues(res.body)).toEqual(['email: invalid_email']);
      expect(passwordReset.request).not.toHaveBeenCalled();
    });

    it('looks the address up in its normalized form', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/password/forgot')
        .send({ email: ' User@Example.COM ' });

      expect(res.status).toBe(202);
      expect(passwordReset.request).toHaveBeenCalledWith('user@example.com');
    });
  });

  describe('POST /auth/password/reset', () => {
    it('holds the new password to the password rules', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/password/reset')
        .send({ token: 'reset-token', password: 'user@example.com' });

      expect(res.status).toBe(400);
      expect(issues(res.body)).toEqual(['password: password_needs_digit']);
      expect(passwordReset.reset).not.toHaveBeenCalled();
    });

    it('accepts a password an email address would fail', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/password/reset')
        .send({ token: 'reset-token', password: 'longenough1' });

      expect(res.status).toBe(200);
      expect(passwordReset.reset).toHaveBeenCalledWith(
        'reset-token',
        'longenough1',
        { signIn: true },
      );
    });
  });

  describe('POST /auth/email/verify', () => {
    it('requires a token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/email/verify')
        .send({ token: '' });

      expect(res.status).toBe(400);
      expect(issues(res.body)).toEqual(['token: token_required']);
      expect(emailVerification.verify).not.toHaveBeenCalled();
    });
  });

  describe('POST /auth/mfa/confirm', () => {
    it('rejects a code that is not six digits', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/mfa/confirm')
        .send({ code: '1234' });

      expect(res.status).toBe(400);
      expect(issues(res.body)).toEqual(['code: invalid_code']);
      expect(signIn.confirmMfa).not.toHaveBeenCalled();
    });

    it('strips the spaces authenticator apps display', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/mfa/confirm')
        .send({ code: ' 12 34 56 ' });

      expect(res.status).toBe(200);
      expect(signIn.confirmMfa).toHaveBeenCalledWith(null, '123456');
    });
  });

  describe('POST /auth/mfa/verify', () => {
    it('requires one of the two factors', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/mfa/verify')
        .send({});

      expect(res.status).toBe(400);
      expect(issues(res.body)).toEqual(['code_required']);
      expect(signIn.completeMfa).not.toHaveBeenCalled();
    });

    it('takes a recovery code on its own', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/mfa/verify')
        .send({ recoveryCode: 'paper-code' });

      expect(res.status).toBe(200);
      expect(signIn.completeMfa).toHaveBeenCalledWith({
        recoveryCode: 'paper-code',
      });
    });

    it('rejects keys the schema does not declare', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/mfa/verify')
        .send({ code: '123456', totp: '123456' });

      expect(res.status).toBe(400);
      expect(issues(res.body)[0]).toMatch(/Unrecognized key/);
      expect(signIn.completeMfa).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /me/email', () => {
    it('rejects a malformed address', async () => {
      const res = await request(app.getHttpServer())
        .patch('/me/email')
        .send({ email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(issues(res.body)).toEqual(['email: invalid_email']);
      expect(users.updateEmail).not.toHaveBeenCalled();
    });

    it('stores the normalized address', async () => {
      const res = await request(app.getHttpServer())
        .patch('/me/email')
        .send({ email: ' New.Address@Example.COM ' });

      expect(res.status).toBe(200);
      expect(users.updateEmail).toHaveBeenCalledWith(
        null,
        'new.address@example.com',
      );
    });
  });
});
