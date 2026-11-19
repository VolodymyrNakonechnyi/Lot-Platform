import { ConflictException } from '@nestjs/common';
import { LOT_STATUS } from '@app/contracts';
import type { BidOutcome, LotState } from './lot-state.interface';
import type { LotContext } from './lot.context';
import { SoldState } from './sold.state';

export class ReservedState implements LotState {
  readonly status = LOT_STATUS.RESERVED;

  constructor(private readonly context: LotContext) {}

  async sell(): Promise<void> {
    await this.context.persist(this.status, LOT_STATUS.SOLD);
    this.context.setState(new SoldState());
  }

  submit(): Promise<void> {
    throw new ConflictException('Cannot submit a reserved lot');
  }

  approve(): Promise<void> {
    throw new ConflictException('Cannot approve a reserved lot');
  }

  reject(): Promise<void> {
    throw new ConflictException('Cannot reject a reserved lot');
  }

  reserve(): Promise<void> {
    throw new ConflictException('Cannot reserve a reserved lot');
  }

  expire(): Promise<void> {
    throw new ConflictException('Cannot expire a reserved lot');
  }

  cancel(): Promise<void> {
    throw new ConflictException('Cannot cancel a reserved lot');
  }

  block(): Promise<void> {
    throw new ConflictException('Cannot block a reserved lot');
  }

  unblock(): Promise<void> {
    throw new ConflictException('Cannot unblock a reserved lot');
  }

  placeBid(): Promise<BidOutcome> {
    throw new ConflictException('Cannot bid on a reserved lot');
  }
}
