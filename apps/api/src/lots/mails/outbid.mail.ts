import { Injectable } from '@nestjs/common';
import type { Mailable } from '@nestjs/mail';
import type { OutbidNotification } from '../state/lot-state.interface';

@Injectable()
export class OutbidMail implements Mailable<OutbidNotification> {
  render({ lotName, previousAmount, currentAmount }: OutbidNotification) {
    return {
      subject: `Your bid on ${lotName} was outbid`,
      template: 'outbid',
      context: { lotName, previousAmount, currentAmount },
    };
  }
}
