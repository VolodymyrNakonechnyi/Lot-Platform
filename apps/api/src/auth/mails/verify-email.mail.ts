import { Injectable } from '@nestjs/common';
import type { Mailable } from '@nestjs/mail';
import type { EmailLinkEvent } from 'src/common/events';

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
