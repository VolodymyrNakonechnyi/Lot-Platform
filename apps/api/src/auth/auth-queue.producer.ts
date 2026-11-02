import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  AUTH_JOB_NAMES,
  JOB_OPTIONS,
  QUEUE_NAMES,
  type AuthJobName,
} from 'src/common/consts';
import type { EmailLinkEvent } from 'src/common/events';

@Injectable()
export class AuthQueueProducer {
  constructor(
    @InjectQueue(QUEUE_NAMES.AUTH)
    private readonly authQueue: Queue<EmailLinkEvent, void, AuthJobName>,
  ) {}

  async addSendEmailVerificationJob(data: EmailLinkEvent) {
    await this.authQueue.add(
      AUTH_JOB_NAMES.SEND_EMAIL_VERIFICATION,
      data,
      JOB_OPTIONS,
    );
  }

  async addSendPasswordResetJob(data: EmailLinkEvent) {
    await this.authQueue.add(
      AUTH_JOB_NAMES.SEND_PASSWORD_RESET,
      data,
      JOB_OPTIONS,
    );
  }
}
