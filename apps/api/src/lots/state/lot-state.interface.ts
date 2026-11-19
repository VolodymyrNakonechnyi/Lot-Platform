import type { LotId, LotStatus } from '@app/contracts';

export interface BidLeader {
  userId: string;
  email: string;
  amount: string;
}

export interface BidOutcome {
  lotName: string;
  amount: string;
  previousLeader: BidLeader | null;
}

export interface OutbidNotification {
  lotId: LotId;
  lotName: string;
  email: string;
  previousAmount: string;
  currentAmount: string;
}

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
  placeBid(userId: string, amount: string): Promise<BidOutcome>;
}

export interface LotStatusStore {
  currentStatus(id: LotId): Promise<LotStatus>;
  changeStatus(id: LotId, from: LotStatus, to: LotStatus): Promise<void>;
  hasBids(id: LotId): Promise<boolean>;
  addBid(id: LotId, userId: string, amount: string): Promise<BidOutcome>;
  notifyOutbid(notification: OutbidNotification): void;
}
