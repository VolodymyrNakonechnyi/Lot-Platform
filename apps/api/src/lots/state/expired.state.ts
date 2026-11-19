import { ConflictException } from '@nestjs/common';
import { LOT_STATUS } from '@app/contracts';
import type { LotState } from './lot-state.interface';

export class ExpiredState implements LotState {
  readonly status = LOT_STATUS.EXPIRED;

  submit(): Promise<void> {
    throw new ConflictException('Cannot submit an expired lot');
  }

  approve(): Promise<void> {
    throw new ConflictException('Cannot approve an expired lot');
  }

  reject(): Promise<void> {
    throw new ConflictException('Cannot reject an expired lot');
  }

  reserve(): Promise<void> {
    throw new ConflictException('Cannot reserve an expired lot');
  }

  sell(): Promise<void> {
    throw new ConflictException('Cannot sell an expired lot');
  }

  expire(): Promise<void> {
    throw new ConflictException('Lot is already expired');
  }

  cancel(): Promise<void> {
    throw new ConflictException('Cannot cancel an expired lot');
  }

  block(): Promise<void> {
    throw new ConflictException('Cannot block an expired lot');
  }

  unblock(): Promise<void> {
    throw new ConflictException('Cannot unblock an expired lot');
  }
}
