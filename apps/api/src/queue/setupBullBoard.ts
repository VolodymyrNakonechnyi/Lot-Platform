import { BullBoardModule } from '@bull-board/nestjs';
import { FastifyAdapter } from '@bull-board/fastify';

export function setupBullBoard() {
  return BullBoardModule.forRoot({
    route: '/admin/queues',
    adapter: FastifyAdapter,
  });
}
