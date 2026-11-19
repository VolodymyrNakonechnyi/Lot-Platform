import { ConflictException } from '@nestjs/common';
import { LOT_STATUS } from '@app/contracts';
import type { BidOutcome, LotState } from './lot-state.interface';
import type { LotContext } from './lot.context';
import { PublishedState } from './published.state';
import { RejectedState } from './rejected.state';

export class PendingState implements LotState {
  readonly status = LOT_STATUS.PENDING;

  constructor(private readonly context: LotContext) {}

  async approve(): Promise<void> {
    await this.context.persist(this.status, LOT_STATUS.PUBLISHED);
    this.context.setState(new PublishedState(this.context));
  }

  async reject(): Promise<void> {
    await this.context.persist(this.status, LOT_STATUS.REJECTED);
    this.context.setState(new RejectedState(this.context));
  }

  submit(): Promise<void> {
    throw new ConflictException('Cannot submit a pending lot');
  }

  reserve(): Promise<void> {
    throw new ConflictException('Cannot reserve a pending lot');
  }

  sell(): Promise<void> {
    throw new ConflictException('Cannot sell a pending lot');
  }

  expire(): Promise<void> {
    throw new ConflictException('Cannot expire a pending lot');
  }

  cancel(): Promise<void> {
    throw new ConflictException('Cannot cancel a pending lot');
  }

  block(): Promise<void> {
    throw new ConflictException('Cannot block a pending lot');
  }

  unblock(): Promise<void> {
    throw new ConflictException('Cannot unblock a pending lot');
  }

  placeBid(): Promise<BidOutcome> {
    throw new ConflictException('Cannot bid on a pending lot');
  }
}
