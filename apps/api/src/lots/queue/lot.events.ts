import type { OutbidNotification } from '../state/lot-state.interface';

export class LotOutbidEvent {
  static readonly eventName = 'lot.outbid';

  constructor(readonly notification: OutbidNotification) {}
}
