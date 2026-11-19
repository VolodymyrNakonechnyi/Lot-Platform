import type { LotId, LotStatus } from '@app/contracts';

export interface LotState {
  readonly status: LotStatus;
  submit(): Promise<void>;
  approve(): Promise<void>;
  reject(): Promise<void>;
  reserve(): Promise<void>;
  sell(): Promise<void>;
  expire(): Promise<void>;
  cancel(): Promise<void>;
  block(): Promise<void>;
  unblock(): Promise<void>;
}

export interface LotStatusStore {
  currentStatus(id: LotId): Promise<LotStatus>;
  changeStatus(id: LotId, from: LotStatus, to: LotStatus): Promise<void>;
  hasBids(id: LotId): Promise<boolean>;
}
