import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { SessionAuth } from './providers/session-auth.provider';
import { JwtAuth } from './providers/jwt-auth.provider';
import { DrizzleAuthenticationStore } from './stores/drizzle-authentication.store';
import { CredentialsService } from './credentials.service';
import { EmailVerificationMailer } from './email-verification.mailer';
import { EmailVerificationController } from './email-verification.controller';
import { PasswordResetMailer } from './password-reset.mailer';
import { PasswordResetController } from './password-reset.controller';
import { TokensController } from './token.controller';
import { MfaController } from './mfa.controller';
import { AccountLinker } from './account-linker';
import { OidcController } from './oidc.controller';
import { MagicLinkController } from './magic-link.controller';
import { MagicLinkMailer } from './magic-link.mailer';
import { SessionsController } from './sessions.controller';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { QUEUE_NAMES } from 'src/common/consts';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

@Module({
  imports: [
    UserModule,
    BullModule.registerQueue({ name: QUEUE_NAMES.AUTH }),
    BullBoardModule.forFeature({
      name: QUEUE_NAMES.AUTH,
      adapter: BullMQAdapter,
    }),
  ],
  providers: [
    CredentialsService,
    SessionAuth,
    JwtAuth,
    DrizzleAuthenticationStore,
    EmailVerificationMailer,
    PasswordResetMailer,
    MagicLinkMailer,
    AccountLinker,
  ],
  controllers: [
    AuthController,
    EmailVerificationController,
    PasswordResetController,
    TokensController,
    MfaController,
    MagicLinkController,
    SessionsController,
    OidcController,
  ],
})
export class AuthModule {}
