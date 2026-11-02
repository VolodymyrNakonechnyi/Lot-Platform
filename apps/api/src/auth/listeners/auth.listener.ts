import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuthQueueProducer } from '../auth-queue.producer';
import {
  EmailVerificationRequestedEvent,
  PasswordResetRequestedEvent,
} from '../auth.events';

@Injectable()
export class AuthListener {
  constructor(private readonly producer: AuthQueueProducer) {}

  @OnEvent(EmailVerificationRequestedEvent.eventName)
  handleEmailVerificationRequested(
    event: EmailVerificationRequestedEvent,
  ): Promise<void> {
    return this.producer.addSendEmailVerificationJob({
      email: event.email,
      url: event.url,
    });
  }

  @OnEvent(PasswordResetRequestedEvent.eventName)
  handlePasswordResetRequested(
    event: PasswordResetRequestedEvent,
  ): Promise<void> {
    return this.producer.addSendPasswordResetJob({
      email: event.email,
      url: event.url,
    });
  }
}
