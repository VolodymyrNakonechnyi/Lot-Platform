import { ConflictException } from '@nestjs/common';
import { LOT_STATUS } from '@app/contracts';
import type { BidOutcome, LotState } from './lot-state.interface';

export class SoldState implements LotState {
  readonly status = LOT_STATUS.SOLD;

  submit(): Promise<void> {
    throw new ConflictException('Cannot submit a sold lot');
  }

  approve(): Promise<void> {
    throw new ConflictException('Cannot approve a sold lot');
  }

  reject(): Promise<void> {
    throw new ConflictException('Cannot reject a sold lot');
  }

  reserve(): Promise<void> {
    throw new ConflictException('Cannot reserve a sold lot');
  }

  sell(): Promise<void> {
    throw new ConflictException('Lot is already sold');
  }

  expire(): Promise<void> {
    throw new ConflictException('Cannot expire a sold lot');
  }

  cancel(): Promise<void> {
    throw new ConflictException('Cannot cancel a sold lot');
  }

  block(): Promise<void> {
    throw new ConflictException('Cannot block a sold lot');
  }

  unblock(): Promise<void> {
    throw new ConflictException('Cannot unblock a sold lot');
  }

  placeBid(): Promise<BidOutcome> {
    throw new ConflictException('Cannot bid on a sold lot');
  }
}
