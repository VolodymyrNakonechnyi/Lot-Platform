import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { SessionAuth } from './providers/session-auth.provider';
import { DrizzleSessionStore } from './stores/drizzle-session.store';

@Module({
  imports: [UserModule],
  providers: [AuthService, SessionAuth, DrizzleSessionStore],
  controllers: [AuthController],
})
export class AuthModule {}
