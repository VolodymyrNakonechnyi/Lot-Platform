import { Injectable } from '@nestjs/common';
import {
  AuthenticationRegistry,
  EmailVerificationHandler,
  type EmailVerificationLink,
} from '@nestjs/authentication';
import type { Mailable } from '@nestjs/mail';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserService } from '../user/user.service';
import { EmailVerificationRequestedEvent } from './auth.events';
import type { EmailLinkEvent } from '../common/events';
import type { User } from '../db/schema';

@Injectable()
export class VerifyEmailMail implements Mailable<EmailLinkEvent> {
  render({ url }: EmailLinkEvent) {
    return {
      subject: 'Confirm your email address',
      template: 'verify-email',
      context: { url },
    };
  }
}

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
