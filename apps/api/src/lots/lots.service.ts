import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, desc, eq, inArray } from 'drizzle-orm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ATTRIBUTE_TYPE,
  LOT_STATUS,
  ROLE,
  type AttributeType,
  type CreateLotDto,
  type LotInputDto,
  type LotDetailsRow,
  type LotId,
  type LotStatus,
  type PublicUser,
  type UpdateLotDto,
} from '@app/contracts';
import { DRIZZLE } from 'src/db/db.module';
import { isForeignKeyViolation } from 'src/db/errors';
import {
  bids,
  categories,
  categoryAttributes,
  deliveryMethods,
  lotDeliveryOptions,
  lotImages,
  lots,
  lostAttributes,
  users,
  type CategoryAttribute,
} from 'src/db/schema';
import { type Database, type Transaction } from 'src/db/types';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { CACHE_KEYS, CACHE_TTL } from 'src/common/cache';
import { prepareLotById, type PreparedLotQuery } from './lots.queries';
import {
  LotContext,
  type BidOutcome,
  type LotStatusStore,
  type OutbidNotification,
} from './state';
import { LotOutbidEvent } from './queue/lot.events';

@Injectable()
export class LotsService implements LotStatusStore {
  private readonly lotById: PreparedLotQuery;

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly events: EventEmitter2,
  ) {
    this.lotById = prepareLotById(db);
  }

  async getLotById(id: string): Promise<LotDetailsRow> {
    const key = CACHE_KEYS.lotDetails(id);
    let lot = await this.cache.get<LotDetailsRow | null>(key);

    if (lot === undefined) {
      lot = (await this.lotById.execute({ id })) ?? null;
      await this.cache.set(key, lot, CACHE_TTL.LOT_DETAILS);
    }

    if (!lot) {
      throw new NotFoundException('Lot not found');
    }

    return lot;
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
          status: LOT_STATUS.DRAFT,
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

    if (dto.status !== LOT_STATUS.DRAFT) {
      const lot = await LotContext.load(id, this);
      await lot.submit();
    }

    return await this.getLotById(id);
  }

  async updateLot(
    id: string,
    user: PublicUser,
    dto: UpdateLotDto,
  ): Promise<LotDetailsRow> {
    await this.assertSellerOrAdmin(id, user);

    const attributes = await this.resolveAttributes(dto);
    const methods = await this.resolveDeliveryMethods(dto);

    await this.db.transaction(async (tx) => {
      await tx
        .update(lots)
        .set({
          name: dto.name,
          categoryId: dto.categoryId,
          startPrice: dto.startPrice,
          minBidStep: dto.minBidStep,
          description: dto.description,
          returnPolicy: dto.returnPolicy,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
        })
        .where(eq(lots.id, id));

      await tx.delete(lostAttributes).where(eq(lostAttributes.lotId, id));
      await tx
        .delete(lotDeliveryOptions)
        .where(eq(lotDeliveryOptions.lotId, id));
      await tx.delete(lotImages).where(eq(lotImages.lotId, id));

      await this.insertRelated(tx, id, dto, attributes, methods);
    });

    await this.cache.del(CACHE_KEYS.lotDetails(id));

    return await this.getLotById(id);
  }

  async deleteLot(id: string, user: PublicUser): Promise<void> {
    await this.assertSellerOrAdmin(id, user);

    const [{ count: placedBids }] = await this.db
      .select({ count: count() })
      .from(bids)
      .where(eq(bids.lotId, id));

    if (placedBids > 0) {
      throw new ConflictException('A lot with bids cannot be deleted');
    }

    try {
      await this.db.transaction(async (tx) => {
        await tx.delete(lostAttributes).where(eq(lostAttributes.lotId, id));
        await tx
          .delete(lotDeliveryOptions)
          .where(eq(lotDeliveryOptions.lotId, id));
        await tx.delete(lotImages).where(eq(lotImages.lotId, id));
        await tx.delete(lots).where(eq(lots.id, id));
      });
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new ConflictException('A lot with payments cannot be deleted');
      }

      throw error;
    }

    await this.cache.del(CACHE_KEYS.lotDetails(id));
  }

  async cancelLot(id: string, user: PublicUser): Promise<LotDetailsRow> {
    await this.assertSellerOrAdmin(id, user);

    const lot = await LotContext.load(id, this);
    await lot.cancel();

    return await this.getLotById(id);
  }

  async submitLot(id: string, user: PublicUser): Promise<LotDetailsRow> {
    await this.assertSellerOrAdmin(id, user);

    const lot = await LotContext.load(id, this);
    await lot.submit();

    return await this.getLotById(id);
  }

  async approveLot(id: string): Promise<LotDetailsRow> {
    const lot = await LotContext.load(id, this);
    await lot.approve();

    return await this.getLotById(id);
  }

  async rejectLot(id: string): Promise<LotDetailsRow> {
    const lot = await LotContext.load(id, this);
    await lot.reject();

    return await this.getLotById(id);
  }

  async blockLot(id: string): Promise<LotDetailsRow> {
    const lot = await LotContext.load(id, this);
    await lot.block();

    return await this.getLotById(id);
  }

  async unblockLot(id: string): Promise<LotDetailsRow> {
    const lot = await LotContext.load(id, this);
    await lot.unblock();

    return await this.getLotById(id);
  }

  async placeBid(
    id: string,
    userId: string,
    amount: string,
  ): Promise<LotDetailsRow> {
    const lot = await LotContext.load(id, this);
    await lot.placeBid(userId, amount);

    return await this.getLotById(id);
  }

  async currentStatus(id: LotId): Promise<LotStatus> {
    const lot = await this.db.query.lots.findFirst({
      columns: { status: true },
      where: eq(lots.id, id),
    });

    if (!lot) {
      throw new NotFoundException('Lot not found');
    }

    return lot.status;
  }

  async changeStatus(id: LotId, from: LotStatus, to: LotStatus): Promise<void> {
    const [changed] = await this.db
      .update(lots)
      .set({ status: to })
      .where(and(eq(lots.id, id), eq(lots.status, from)))
      .returning({ id: lots.id });

    if (!changed) {
      throw new ConflictException(`Lot is no longer ${from}`);
    }

    await this.cache.del(CACHE_KEYS.lotDetails(id));
  }

  async hasBids(id: LotId): Promise<boolean> {
    const [{ count: placedBids }] = await this.db
      .select({ count: count() })
      .from(bids)
      .where(eq(bids.lotId, id));

    return placedBids > 0;
  }

  async addBid(id: LotId, userId: string, amount: string): Promise<BidOutcome> {
    const outcome = await this.db.transaction(async (tx) => {
      const [lot] = await tx
        .select({
          name: lots.name,
          sellerId: lots.sellerId,
          startPrice: lots.startPrice,
          minBidStep: lots.minBidStep,
          endDate: lots.endDate,
        })
        .from(lots)
        .where(eq(lots.id, id))
        .for('update');

      if (!lot) {
        throw new NotFoundException('Lot not found');
      }

      if (lot.sellerId === userId) {
        throw new ForbiddenException('A seller cannot bid on their own lot');
      }

      if (lot.endDate.getTime() <= Date.now()) {
        throw new ConflictException('Bidding has ended for this lot');
      }

      const [leader] = await tx
        .select({
          userId: bids.userId,
          amount: bids.amount,
          email: users.email,
        })
        .from(bids)
        .innerJoin(users, eq(users.id, bids.userId))
        .where(eq(bids.lotId, id))
        .orderBy(desc(bids.amount))
        .limit(1);

      const minimum = leader
        ? Number(leader.amount) + Number(lot.minBidStep)
        : Number(lot.startPrice);

      if (Number(amount) < minimum) {
        throw new ConflictException(
          `Bid must be at least ${minimum.toFixed(2)}`,
        );
      }

      await tx.insert(bids).values({ lotId: id, userId, amount });

      return { lotName: lot.name, amount, previousLeader: leader ?? null };
    });

    await this.cache.del(CACHE_KEYS.lotDetails(id));

    return outcome;
  }

  notifyOutbid(notification: OutbidNotification): void {
    this.events.emit(
      LotOutbidEvent.eventName,
      new LotOutbidEvent(notification),
    );
  }

  private async assertSellerOrAdmin(
    id: string,
    user: PublicUser,
  ): Promise<void> {
    const lot = await this.db.query.lots.findFirst({
      columns: { sellerId: true },
      where: eq(lots.id, id),
    });

    if (!lot) {
      throw new NotFoundException('Lot not found');
    }

    if (user.role !== ROLE.ADMIN && lot.sellerId !== user.id) {
      throw new ForbiddenException('Only the seller can change this lot');
    }
  }

  private async insertRelated(
    tx: Transaction,
    lotId: string,
    dto: LotInputDto,
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
    dto: LotInputDto,
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
    dto: LotInputDto,
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
