import { Injectable } from '@nestjs/common';
import {
  AuthenticationRegistry,
  PasswordResetHandler,
  type PasswordResetAccount,
  type PasswordResetLink,
} from '@nestjs/authentication';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserService } from 'src/user/user.service';
import { PasswordResetRequestedEvent } from '../queue/auth.events';

@Injectable()
export class PasswordResetMailer extends PasswordResetHandler {
  constructor(
    private readonly usersService: UserService,
    private readonly events: EventEmitter2,
    registry: AuthenticationRegistry,
  ) {
    super();
    registry.registerHandler('passwordReset', this);
  }

  // The link goes to the address the account has stored, and works only while
  // the account keeps that address and this hash: any change invalidates it.
  async findUser(email: string): Promise<PasswordResetAccount | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null;
    }

    return { id: user.id, email: user.email, passwordHash: user.password };
  }

  async send(link: PasswordResetLink) {
    await this.events.emitAsync(
      PasswordResetRequestedEvent.eventName,
      new PasswordResetRequestedEvent(link.email, link.url),
    );
  }

  updatePassword(userId: string, passwordHash: string) {
    return this.usersService.updatePassword(userId, passwordHash);
  }
}
