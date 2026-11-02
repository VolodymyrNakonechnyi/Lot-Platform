import { Injectable } from '@nestjs/common';
import {
  AuthenticationRegistry,
  EmailVerificationHandler,
  type EmailVerificationLink,
} from '@nestjs/authentication';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserService } from 'src/user/user.service';
import type { User } from 'src/db/schema';
import { EmailVerificationRequestedEvent } from '../queue/auth.events';

@Injectable()
export class EmailVerificationMailer extends EmailVerificationHandler {
  constructor(
    private readonly userService: UserService,
    private readonly events: EventEmitter2,
    registry: AuthenticationRegistry,
  ) {
    super();
    registry.registerHandler('emailVerification', this);
  }

  async send(link: EmailVerificationLink) {
    const to = process.env.MAIL_REDIRECT_TO ?? link.email;
    await this.events.emitAsync(
      EmailVerificationRequestedEvent.eventName,
      new EmailVerificationRequestedEvent(to, link.url),
    );
  }

  markVerified(userId: string, email: string) {
    return this.userService.markEmailVerified(userId, email);
  }

  isVerified(user: User) {
    return user.confirmedEmail;
  }
}
