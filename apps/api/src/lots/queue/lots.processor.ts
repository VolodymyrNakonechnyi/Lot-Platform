import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Mailer } from '@nestjs/mail';
import { Job } from 'bullmq';
import { LOT_JOB_NAMES, QUEUE_NAMES, type LotJobName } from 'src/common/consts';
import type { OutbidNotification } from '../state/lot-state.interface';
import { OutbidMail } from '../mails/outbid.mail';

@Processor(QUEUE_NAMES.LOTS)
export class LotsProcessor extends WorkerHost {
  private readonly logger = new Logger(LotsProcessor.name);

  constructor(private readonly mailer: Mailer) {
    super();
  }

  async process(job: Job<OutbidNotification, void, LotJobName>): Promise<void> {
    if (job.name !== LOT_JOB_NAMES.NOTIFY_OUTBID) {
      throw new Error(`Unknown job name: ${String(job.name)}`);
    }

    await this.mailer.send(OutbidMail, {
      to: job.data.email,
      data: job.data,
    });

    this.logger.log(`outbid notice sent to ${job.data.email}`);
  }
}
