import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { UserModule } from 'src/user/user.module';
import { QUEUE_NAMES } from 'src/common/consts';
import { CredentialsService } from './credentials.service';
import { AuthController } from './controllers/auth.controller';
import { EmailVerificationController } from './controllers/email-verification.controller';
import { MagicLinkController } from './controllers/magic-link.controller';
import { MfaController } from './controllers/mfa.controller';
import { OidcController } from './controllers/oidc.controller';
import { PasswordResetController } from './controllers/password-reset.controller';
import { SessionsController } from './controllers/sessions.controller';
import { TokensController } from './controllers/token.controller';
import { AccountLinker } from './handlers/account-linker';
import { EmailVerificationMailer } from './handlers/email-verification.mailer';
import { MagicLinkMailer } from './handlers/magic-link.mailer';
import { PasswordResetMailer } from './handlers/password-reset.mailer';
import { AuthQueueProducer } from './queue/auth-queue.producer';
import { AuthListener } from './queue/auth.listener';
import { AuthProcessor } from './queue/auth.processor';
import { SessionAuth } from './providers/session-auth.provider';
import { JwtAuth } from './providers/jwt-auth.provider';
import { DrizzleAuthenticationStore } from './stores/drizzle-authentication.store';

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
    AuthQueueProducer,
    AuthProcessor,
    AuthListener,
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
