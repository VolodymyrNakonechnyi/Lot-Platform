import { ConflictException } from '@nestjs/common';
import { LOT_STATUS } from '@app/contracts';
import type { BidOutcome, LotState } from './lot-state.interface';
import type { LotContext } from './lot.context';
import { ReservedState } from './reserved.state';
import { ExpiredState } from './expired.state';
import { CancelledState } from './cancelled.state';
import { BlockedState } from './blocked.state';

export class PublishedState implements LotState {
  readonly status = LOT_STATUS.PUBLISHED;

  constructor(private readonly context: LotContext) {}

  async placeBid(userId: string, amount: string): Promise<BidOutcome> {
    const outcome = await this.context.store.addBid(
      this.context.lotId,
      userId,
      amount,
    );
    const leader = outcome.previousLeader;

    if (leader && leader.userId !== userId) {
      this.context.store.notifyOutbid({
        lotId: this.context.lotId,
        lotName: outcome.lotName,
        email: leader.email,
        previousAmount: leader.amount,
        currentAmount: outcome.amount,
      });
    }

    return outcome;
  }

  async reserve(): Promise<void> {
    await this.context.persist(this.status, LOT_STATUS.RESERVED);
    this.context.setState(new ReservedState(this.context));
  }

  async expire(): Promise<void> {
    await this.context.persist(this.status, LOT_STATUS.EXPIRED);
    this.context.setState(new ExpiredState());
  }

  async block(): Promise<void> {
    await this.context.persist(this.status, LOT_STATUS.BLOCKED);
    this.context.setState(new BlockedState(this.context));
  }

  async cancel(): Promise<void> {
    if (await this.context.store.hasBids(this.context.lotId)) {
      throw new ConflictException('A lot with bids cannot be cancelled');
    }

    await this.context.persist(this.status, LOT_STATUS.CANCELLED);
    this.context.setState(new CancelledState());
  }

  submit(): Promise<void> {
    throw new ConflictException('Cannot submit a published lot');
  }

  approve(): Promise<void> {
    throw new ConflictException('Cannot approve a published lot');
  }

  reject(): Promise<void> {
    throw new ConflictException('Cannot reject a published lot');
  }

  sell(): Promise<void> {
    throw new ConflictException('Cannot sell a published lot');
  }

  unblock(): Promise<void> {
    throw new ConflictException('Cannot unblock a published lot');
  }
}
