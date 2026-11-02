import type { EmailEvent } from '../common/events';

export class UserCreatedEvent implements EmailEvent {
  static readonly eventName = 'user.created';

  constructor(
    public readonly id: string,
    public readonly email: string,
  ) {}
}
