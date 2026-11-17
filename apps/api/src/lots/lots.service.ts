import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import {
  ATTRIBUTE_TYPE,
  type AttributeType,
  type CreateLotDto,
  type LotDetailsRow,
} from '@app/contracts';
import { DRIZZLE } from 'src/db/db.module';
import {
  categories,
  categoryAttributes,
  deliveryMethods,
  lotDeliveryOptions,
  lotImages,
  lots,
  lostAttributes,
  type CategoryAttribute,
} from 'src/db/schema';
import { type Database, type Transaction } from 'src/db/types';

@Injectable()
export class LotsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async getLot(id: string): Promise<LotDetailsRow | undefined> {
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
    });
  }

  async createLot(sellerId: string, dto: CreateLotDto): Promise<LotDetailsRow> {
    const attributes = await this.resolveAttributes(dto);
    const methods = await this.resolveDeliveryMethods(dto);

    const id = await this.db.transaction(async (tx) => {
      const [lot] = await tx
        .insert(lots)
        .values({
          name: dto.name,
          categoryId: dto.categoryId,
          sellerId,
          status: dto.status,
          startPrice: dto.startPrice,
          minBidStep: dto.minBidStep,
          description: dto.description,
          returnPolicy: dto.returnPolicy,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
        })
        .returning({ id: lots.id });

      await this.insertRelated(tx, lot.id, dto, attributes, methods);

      return lot.id;
    });

    const created = await this.getLot(id);

    if (!created) {
      throw new NotFoundException('Lot not found');
    }

    return created;
  }

  private async insertRelated(
    tx: Transaction,
    lotId: string,
    dto: CreateLotDto,
    attributes: Map<string, CategoryAttribute>,
    methods: Map<string, number>,
  ): Promise<void> {
    if (dto.attributes.length > 0) {
      await tx.insert(lostAttributes).values(
        dto.attributes.map(({ key, value }) => ({
          lotId,
          categoryAttributeId: attributes.get(key)!.id,
          value,
        })),
      );
    }

    if (dto.deliveryOptions.length > 0) {
      await tx.insert(lotDeliveryOptions).values(
        dto.deliveryOptions.map(({ method, payment, note }) => ({
          lotId,
          deliveryMethodId: methods.get(method)!,
          payment,
          note,
        })),
      );
    }

    if (dto.images.length > 0) {
      await tx.insert(lotImages).values(
        dto.images.map(({ url, sortOrder }, index) => ({
          lotId,
          url,
          sortOrder: sortOrder ?? index,
        })),
      );
    }
  }

  private async resolveAttributes(
    dto: CreateLotDto,
  ): Promise<Map<string, CategoryAttribute>> {
    const category = await this.db.query.categories.findFirst({
      columns: { id: true },
      where: eq(categories.id, dto.categoryId),
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const defined = await this.db
      .select()
      .from(categoryAttributes)
      .where(eq(categoryAttributes.categoryId, dto.categoryId));

    const byKey = new Map(
      defined.map((attribute) => [attribute.key, attribute]),
    );
    const seen = new Set<string>();

    for (const { key, value } of dto.attributes) {
      const attribute = byKey.get(key);

      if (!attribute) {
        throw new BadRequestException(`Unknown attribute for category: ${key}`);
      }

      if (seen.has(key)) {
        throw new BadRequestException(`Duplicate attribute: ${key}`);
      }

      seen.add(key);
      assertAttributeValue(attribute.type, key, value);
    }

    const missing = defined
      .filter((attribute) => attribute.required && !seen.has(attribute.key))
      .map((attribute) => attribute.key);

    if (missing.length > 0) {
      throw new BadRequestException(
        `Missing required attributes: ${missing.join(', ')}`,
      );
    }

    return byKey;
  }

  private async resolveDeliveryMethods(
    dto: CreateLotDto,
  ): Promise<Map<string, number>> {
    const slugs = dto.deliveryOptions.map(({ method }) => method);

    if (slugs.length === 0) {
      return new Map();
    }

    if (new Set(slugs).size !== slugs.length) {
      throw new BadRequestException('Duplicate delivery method');
    }

    const found = await this.db
      .select({ id: deliveryMethods.id, slug: deliveryMethods.slug })
      .from(deliveryMethods)
      .where(inArray(deliveryMethods.slug, slugs));

    const bySlug = new Map(found.map(({ slug, id }) => [slug, id]));
    const unknown = slugs.filter((slug) => !bySlug.has(slug));

    if (unknown.length > 0) {
      throw new BadRequestException(
        `Unknown delivery methods: ${unknown.join(', ')}`,
      );
    }

    return bySlug;
  }
}

function assertAttributeValue(
  type: AttributeType,
  key: string,
  value: string,
): void {
  if (type === ATTRIBUTE_TYPE.NUMBER && !Number.isFinite(Number(value))) {
    throw new BadRequestException(`Attribute ${key} must be a number`);
  }

  if (
    type === ATTRIBUTE_TYPE.BOOLEAN &&
    value !== 'true' &&
    value !== 'false'
  ) {
    throw new BadRequestException(`Attribute ${key} must be true or false`);
  }

  if (type === ATTRIBUTE_TYPE.DATE && Number.isNaN(Date.parse(value))) {
    throw new BadRequestException(`Attribute ${key} must be a date`);
  }
}
