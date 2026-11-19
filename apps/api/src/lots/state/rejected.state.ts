import { ConflictException } from '@nestjs/common';
import { LOT_STATUS } from '@app/contracts';
import type { LotState } from './lot-state.interface';
import type { LotContext } from './lot.context';
import { PendingState } from './pending.state';

export class RejectedState implements LotState {
  readonly status = LOT_STATUS.REJECTED;

  constructor(private readonly context: LotContext) {}

  async submit(): Promise<void> {
    await this.context.persist(this.status, LOT_STATUS.PENDING);
    this.context.setState(new PendingState(this.context));
  }

  approve(): Promise<void> {
    throw new ConflictException('Cannot approve a rejected lot');
  }

  reject(): Promise<void> {
    throw new ConflictException('Cannot reject a rejected lot');
  }

  reserve(): Promise<void> {
    throw new ConflictException('Cannot reserve a rejected lot');
  }

  sell(): Promise<void> {
    throw new ConflictException('Cannot sell a rejected lot');
  }

  expire(): Promise<void> {
    throw new ConflictException('Cannot expire a rejected lot');
  }

  cancel(): Promise<void> {
    throw new ConflictException('Cannot cancel a rejected lot');
  }

  block(): Promise<void> {
    throw new ConflictException('Cannot block a rejected lot');
  }

  unblock(): Promise<void> {
    throw new ConflictException('Cannot unblock a rejected lot');
  }
}
