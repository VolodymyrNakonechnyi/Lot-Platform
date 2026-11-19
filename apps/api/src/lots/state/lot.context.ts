import { LOT_STATUS, type LotId, type LotStatus } from '@app/contracts';
import type {
  BidOutcome,
  LotState,
  LotStatusStore,
} from './lot-state.interface';
import { DraftState } from './draft.state';
import { PendingState } from './pending.state';
import { RejectedState } from './rejected.state';
import { PublishedState } from './published.state';
import { ReservedState } from './reserved.state';
import { BlockedState } from './blocked.state';
import { SoldState } from './sold.state';
import { ExpiredState } from './expired.state';
import { CancelledState } from './cancelled.state';

export class LotContext implements LotState {
  private state: LotState;

  private constructor(
    readonly lotId: LotId,
    readonly store: LotStatusStore,
    status: LotStatus,
  ) {
    this.state = this.createState(status);
  }

  static async load(lotId: LotId, store: LotStatusStore): Promise<LotContext> {
    return new LotContext(lotId, store, await store.currentStatus(lotId));
  }

  setState(state: LotState): void {
    this.state = state;
  }

  persist(from: LotStatus, to: LotStatus): Promise<void> {
    return this.store.changeStatus(this.lotId, from, to);
  }

  get status(): LotStatus {
    return this.state.status;
  }

  submit(): Promise<void> {
    return this.state.submit();
  }

  approve(): Promise<void> {
    return this.state.approve();
  }

  reject(): Promise<void> {
    return this.state.reject();
  }

  reserve(): Promise<void> {
    return this.state.reserve();
  }

  sell(): Promise<void> {
    return this.state.sell();
  }

  expire(): Promise<void> {
    return this.state.expire();
  }

  cancel(): Promise<void> {
    return this.state.cancel();
  }

  block(): Promise<void> {
    return this.state.block();
  }

  placeBid(userId: string, amount: string): Promise<BidOutcome> {
    return this.state.placeBid(userId, amount);
  }

  unblock(): Promise<void> {
    return this.state.unblock();
  }

  private createState(status: LotStatus): LotState {
    switch (status) {
      case LOT_STATUS.DRAFT:
        return new DraftState(this);
      case LOT_STATUS.PENDING:
        return new PendingState(this);
      case LOT_STATUS.REJECTED:
        return new RejectedState(this);
      case LOT_STATUS.PUBLISHED:
        return new PublishedState(this);
      case LOT_STATUS.RESERVED:
        return new ReservedState(this);
      case LOT_STATUS.BLOCKED:
        return new BlockedState(this);
      case LOT_STATUS.SOLD:
        return new SoldState();
      case LOT_STATUS.EXPIRED:
        return new ExpiredState();
      case LOT_STATUS.CANCELLED:
        return new CancelledState();
    }
  }
}
