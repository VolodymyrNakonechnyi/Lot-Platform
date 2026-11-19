import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  JOB_OPTIONS,
  LOT_JOB_NAMES,
  QUEUE_NAMES,
  type LotJobName,
} from 'src/common/consts';
import type { OutbidNotification } from '../state/lot-state.interface';

@Injectable()
export class LotsQueueProducer {
  constructor(
    @InjectQueue(QUEUE_NAMES.LOTS)
    private readonly lotsQueue: Queue<OutbidNotification, void, LotJobName>,
  ) {}

  async addNotifyOutbidJob(notification: OutbidNotification): Promise<void> {
    await this.lotsQueue.add(
      LOT_JOB_NAMES.NOTIFY_OUTBID,
      notification,
      JOB_OPTIONS,
    );
  }
}
