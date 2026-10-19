import { Injectable } from '@nestjs/common';
import {
  AuthenticationRegistry,
  SessionCookieProvider,
  type SessionRecord,
} from '@nestjs/authentication';
import type { PublicUser } from '@app/contracts';

@Injectable()
export class SessionAuth extends SessionCookieProvider<PublicUser> {
  constructor(registry: AuthenticationRegistry) {
    super();
    registry.registerProvider(this);
  }

  validate(session: SessionRecord): PublicUser | null {
    return session.extra?.user ?? null;
  }
}
