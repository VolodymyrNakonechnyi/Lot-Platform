import { ConflictException } from '@nestjs/common';
import { LOT_STATUS } from '@app/contracts';
import type { LotState } from './lot-state.interface';

export class CancelledState implements LotState {
  readonly status = LOT_STATUS.CANCELLED;

  submit(): Promise<void> {
    throw new ConflictException('Cannot submit a cancelled lot');
  }

  approve(): Promise<void> {
    throw new ConflictException('Cannot approve a cancelled lot');
  }

  reject(): Promise<void> {
    throw new ConflictException('Cannot reject a cancelled lot');
  }

  reserve(): Promise<void> {
    throw new ConflictException('Cannot reserve a cancelled lot');
  }

  sell(): Promise<void> {
    throw new ConflictException('Cannot sell a cancelled lot');
  }

  expire(): Promise<void> {
    throw new ConflictException('Cannot expire a cancelled lot');
  }

  cancel(): Promise<void> {
    throw new ConflictException('Lot is already cancelled');
  }

  block(): Promise<void> {
    throw new ConflictException('Cannot block a cancelled lot');
  }

  unblock(): Promise<void> {
    throw new ConflictException('Cannot unblock a cancelled lot');
  }
}
