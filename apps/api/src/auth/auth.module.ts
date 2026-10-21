import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { SessionAuth } from './providers/session-auth.provider';
import { DrizzleSessionStore } from './stores/drizzle-session.store';
import { CredentialsService } from './credentials.service';

@Module({
  imports: [UserModule],
  providers: [CredentialsService, SessionAuth, DrizzleSessionStore],
  controllers: [AuthController],
})
export class AuthModule {}
