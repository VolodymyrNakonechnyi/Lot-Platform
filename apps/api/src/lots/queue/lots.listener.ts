import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LotOutbidEvent } from './lot.events';
import { LotsQueueProducer } from './lots-queue.producer';

@Injectable()
export class LotsListener {
  constructor(private readonly producer: LotsQueueProducer) {}

  @OnEvent(LotOutbidEvent.eventName)
  handleOutbid(event: LotOutbidEvent): Promise<void> {
    return this.producer.addNotifyOutbidJob(event.notification);
  }
}
