import { Injectable } from '@nestjs/common';
import type { Mailable } from '@nestjs/mail';
import type { EmailLinkEvent } from 'src/common/events';

@Injectable()
export class PasswordResetMail implements Mailable<EmailLinkEvent> {
  render({ url }: EmailLinkEvent) {
    return {
      subject: 'Reset your password',
      template: 'password-reset',
      context: { url },
    };
  }
}
