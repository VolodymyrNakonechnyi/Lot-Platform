import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from 'src/db/db.module';
import { lots } from 'src/db/schema';
import { type Database } from 'src/db/types';

@Injectable()
export class LotsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async getLot(id: string) {
    return await this.db.query.lots.findFirst({
      where: eq(lots.id, id),
      extras: (lot, { sql }) => ({
        currentPrice:
          sql<string>`coalesce((select max(b.amount) from bids b where b.lot_id = ${lot.id}), ${lot.startPrice})`.as(
            'current_price',
          ),
        bidCount:
          sql<number>`(select count(*)::int from bids b where b.lot_id = ${lot.id})`.as(
            'bid_count',
          ),
      }),
      with: {
        category: {
          columns: { id: true, name: true, slug: true, parentId: true },
        },
        seller: {
          columns: { id: true, username: true, name: true, avatarUrl: true },
        },
        images: {
          columns: { url: true, sortOrder: true },
          orderBy: (img, { asc }) => [asc(img.sortOrder)],
        },
        deliveryOptions: {
          columns: { payment: true, note: true },
          with: {
            method: { columns: { slug: true, name: true, sortOrder: true } },
          },
        },
        attributes: {
          columns: { value: true },
          with: {
            categoryAttribute: {
              columns: {
                key: true,
                label: true,
                type: true,
                unit: true,
                multiple: true,
                filterable: true,
              },
            },
          },
        },
      },
    });
  }
}
