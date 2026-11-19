import { ConflictException } from '@nestjs/common';
import { LOT_STATUS } from '@app/contracts';
import type { LotState } from './lot-state.interface';
import type { LotContext } from './lot.context';
import { DraftState } from './draft.state';

export class BlockedState implements LotState {
  readonly status = LOT_STATUS.BLOCKED;

  constructor(private readonly context: LotContext) {}

  async unblock(): Promise<void> {
    await this.context.persist(this.status, LOT_STATUS.DRAFT);
    this.context.setState(new DraftState(this.context));
  }

  submit(): Promise<void> {
    throw new ConflictException('Cannot submit a blocked lot');
  }

  approve(): Promise<void> {
    throw new ConflictException('Cannot approve a blocked lot');
  }

  reject(): Promise<void> {
    throw new ConflictException('Cannot reject a blocked lot');
  }

  reserve(): Promise<void> {
    throw new ConflictException('Cannot reserve a blocked lot');
  }

  sell(): Promise<void> {
    throw new ConflictException('Cannot sell a blocked lot');
  }

  expire(): Promise<void> {
    throw new ConflictException('Cannot expire a blocked lot');
  }

  cancel(): Promise<void> {
    throw new ConflictException('Cannot cancel a blocked lot');
  }

  block(): Promise<void> {
    throw new ConflictException('Cannot block a blocked lot');
  }
}
