import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { SessionAuth } from './providers/session-auth.provider';
import { JwtAuth } from './providers/jwt-auth.provider';
import { DrizzleSessionStore } from './stores/drizzle-session.store';
import { CredentialsService } from './credentials.service';
import { EmailVerificationMailer } from './email-verification.mailer';
import { EmailVerificationController } from './email-verification.controller';
import { PasswordResetMailer } from './password-reset.mailer';
import { PasswordResetController } from './password-reset.controller';
import { TokensController } from './token.controller';
import { MfaController } from './mfa.controller';

@Module({
  imports: [UserModule],
  providers: [
    CredentialsService,
    SessionAuth,
    JwtAuth,
    DrizzleSessionStore,
    EmailVerificationMailer,
    PasswordResetMailer,
  ],
  controllers: [
    AuthController,
    EmailVerificationController,
    PasswordResetController,
    TokensController,
    MfaController,
  ],
})
export class AuthModule {}
