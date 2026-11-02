import type { EmailLinkEvent } from '../common/events';

export class EmailVerificationRequestedEvent implements EmailLinkEvent {
  static readonly eventName = 'auth.email-verification-requested';

  constructor(
    public readonly email: string,
    public readonly url: string,
  ) {}
}

export class PasswordResetRequestedEvent implements EmailLinkEvent {
  static readonly eventName = 'auth.password-reset-requested';

  constructor(
    public readonly email: string,
    public readonly url: string,
  ) {}
}
