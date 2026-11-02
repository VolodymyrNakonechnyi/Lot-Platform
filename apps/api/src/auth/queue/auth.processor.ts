import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Mailer } from '@nestjs/mail';
import { Job } from 'bullmq';
import {
  AUTH_JOB_NAMES,
  QUEUE_NAMES,
  type AuthJobName,
} from 'src/common/consts';
import type { EmailLinkEvent } from 'src/common/events';
import { VerifyEmailMail } from '../mails/verify-email.mail';
import { PasswordResetMail } from '../mails/password-reset.mail';

@Processor(QUEUE_NAMES.AUTH)
export class AuthProcessor extends WorkerHost {
  private readonly logger = new Logger(AuthProcessor.name);

  constructor(private readonly mailer: Mailer) {
    super();
  }

  async process(job: Job<EmailLinkEvent, void, AuthJobName>): Promise<void> {
    const { email } = job.data;

    switch (job.name) {
      case AUTH_JOB_NAMES.SEND_EMAIL_VERIFICATION:
        await this.mailer.send(VerifyEmailMail, { to: email, data: job.data });
        break;
      case AUTH_JOB_NAMES.SEND_PASSWORD_RESET:
        await this.mailer.send(PasswordResetMail, {
          to: email,
          data: job.data,
        });
        break;
      default:
        throw new Error(`Unknown job name: ${String(job.name)}`);
    }

    this.logger.log(`${String(job.name)} delivered to ${email}`);
  }
}
