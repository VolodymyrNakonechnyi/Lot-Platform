import { eq, sql } from 'drizzle-orm';
import type { LotDetailsRow } from '@app/contracts';
import { lots } from 'src/db/schema';
import type { Database } from 'src/db/types';

export interface PreparedLotQuery {
  execute(params: { id: string }): Promise<LotDetailsRow | undefined>;
}

export function prepareLotById(db: Database): PreparedLotQuery {
  return db.query.lots
    .findFirst({
      where: eq(lots.id, sql.placeholder('id')),
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
      columns: {
        id: true,
        name: true,
        status: true,
        startPrice: true,
        soldPrice: true,
        minBidStep: true,
        description: true,
        returnPolicy: true,
        startDate: true,
        endDate: true,
        updatedAt: true,
        createdAt: true,
      },
      with: {
        category: {
          columns: { id: true, name: true, slug: true, parentId: true },
        },
        buyer: {
          columns: { id: true, username: true, name: true, avatarUrl: true },
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
    })
    .prepare('lot_by_id');
}
