import { ConflictException } from '@nestjs/common';
import { LOT_STATUS } from '@app/contracts';
import type { LotState } from './lot-state.interface';
import type { LotContext } from './lot.context';
import { PendingState } from './pending.state';
import { CancelledState } from './cancelled.state';

export class DraftState implements LotState {
  readonly status = LOT_STATUS.DRAFT;

  constructor(private readonly context: LotContext) {}

  async submit(): Promise<void> {
    await this.context.persist(this.status, LOT_STATUS.PENDING);
    this.context.setState(new PendingState(this.context));
  }

  async cancel(): Promise<void> {
    await this.context.persist(this.status, LOT_STATUS.CANCELLED);
    this.context.setState(new CancelledState());
  }

  approve(): Promise<void> {
    throw new ConflictException('Cannot approve a draft lot');
  }

  reject(): Promise<void> {
    throw new ConflictException('Cannot reject a draft lot');
  }

  reserve(): Promise<void> {
    throw new ConflictException('Cannot reserve a draft lot');
  }

  sell(): Promise<void> {
    throw new ConflictException('Cannot sell a draft lot');
  }

  expire(): Promise<void> {
    throw new ConflictException('Cannot expire a draft lot');
  }

  block(): Promise<void> {
    throw new ConflictException('Cannot block a draft lot');
  }

  unblock(): Promise<void> {
    throw new ConflictException('Cannot unblock a draft lot');
  }
}
