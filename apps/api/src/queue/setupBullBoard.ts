import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';

export function setupBullBoard() {
  return BullBoardModule.forRoot({
    route: '/admin/queues',
    adapter: ExpressAdapter,
  });
}
