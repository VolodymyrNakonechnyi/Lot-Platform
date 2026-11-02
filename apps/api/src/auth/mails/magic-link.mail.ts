import { Injectable } from '@nestjs/common';
import type { MagicLink } from '@nestjs/authentication';
import type { Mailable } from '@nestjs/mail';

@Injectable()
export class MagicLinkMail implements Mailable<MagicLink> {
  render({ url }: MagicLink) {
    return {
      subject: 'Your sign-in link',
      template: 'magic-link',
      context: { url },
    };
  }
}
