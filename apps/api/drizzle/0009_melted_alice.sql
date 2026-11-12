ALTER TABLE "bids" DROP CONSTRAINT "bids_lot_id_lots_id_fk";--> statement-breakpoint
ALTER TABLE "lots_attributes" DROP CONSTRAINT "lots_attributes_lot_id_lots_id_fk";--> statement-breakpoint
ALTER TABLE "lot_delivery_options" DROP CONSTRAINT "lot_delivery_options_lot_id_lots_id_fk";--> statement-breakpoint
ALTER TABLE "lot_images" DROP CONSTRAINT "lot_images_lot_id_lots_id_fk";--> statement-breakpoint
ALTER TABLE "lot_views" DROP CONSTRAINT "lot_views_lot_id_lots_id_fk";--> statement-breakpoint
ALTER TABLE "lot_watchers" DROP CONSTRAINT "lot_watchers_lot_id_lots_id_fk";--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_lot_id_lots_id_fk";--> statement-breakpoint
ALTER TABLE "lots" ADD COLUMN "uuid_id" uuid DEFAULT uuidv7() NOT NULL;--> statement-breakpoint
ALTER TABLE "bids" ADD COLUMN "uuid_lot_id" uuid;--> statement-breakpoint
ALTER TABLE "lots_attributes" ADD COLUMN "uuid_lot_id" uuid;--> statement-breakpoint
ALTER TABLE "lot_delivery_options" ADD COLUMN "uuid_lot_id" uuid;--> statement-breakpoint
ALTER TABLE "lot_images" ADD COLUMN "uuid_lot_id" uuid;--> statement-breakpoint
ALTER TABLE "lot_views" ADD COLUMN "uuid_lot_id" uuid;--> statement-breakpoint
ALTER TABLE "lot_watchers" ADD COLUMN "uuid_lot_id" uuid;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "uuid_lot_id" uuid;--> statement-breakpoint
UPDATE "bids" c SET "uuid_lot_id" = l."uuid_id" FROM "lots" l WHERE l."id" = c."lot_id";--> statement-breakpoint
UPDATE "lots_attributes" c SET "uuid_lot_id" = l."uuid_id" FROM "lots" l WHERE l."id" = c."lot_id";--> statement-breakpoint
UPDATE "lot_delivery_options" c SET "uuid_lot_id" = l."uuid_id" FROM "lots" l WHERE l."id" = c."lot_id";--> statement-breakpoint
UPDATE "lot_images" c SET "uuid_lot_id" = l."uuid_id" FROM "lots" l WHERE l."id" = c."lot_id";--> statement-breakpoint
UPDATE "lot_views" c SET "uuid_lot_id" = l."uuid_id" FROM "lots" l WHERE l."id" = c."lot_id";--> statement-breakpoint
UPDATE "lot_watchers" c SET "uuid_lot_id" = l."uuid_id" FROM "lots" l WHERE l."id" = c."lot_id";--> statement-breakpoint
UPDATE "payments" c SET "uuid_lot_id" = l."uuid_id" FROM "lots" l WHERE l."id" = c."lot_id";--> statement-breakpoint
ALTER TABLE "bids" DROP COLUMN "lot_id";--> statement-breakpoint
ALTER TABLE "lots_attributes" DROP COLUMN "lot_id";--> statement-breakpoint
ALTER TABLE "lot_delivery_options" DROP COLUMN "lot_id";--> statement-breakpoint
ALTER TABLE "lot_images" DROP COLUMN "lot_id";--> statement-breakpoint
ALTER TABLE "lot_views" DROP COLUMN "lot_id";--> statement-breakpoint
ALTER TABLE "lot_watchers" DROP COLUMN "lot_id";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "lot_id";--> statement-breakpoint
ALTER TABLE "lots" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "bids" RENAME COLUMN "uuid_lot_id" TO "lot_id";--> statement-breakpoint
ALTER TABLE "lots_attributes" RENAME COLUMN "uuid_lot_id" TO "lot_id";--> statement-breakpoint
ALTER TABLE "lot_delivery_options" RENAME COLUMN "uuid_lot_id" TO "lot_id";--> statement-breakpoint
ALTER TABLE "lot_images" RENAME COLUMN "uuid_lot_id" TO "lot_id";--> statement-breakpoint
ALTER TABLE "lot_views" RENAME COLUMN "uuid_lot_id" TO "lot_id";--> statement-breakpoint
ALTER TABLE "lot_watchers" RENAME COLUMN "uuid_lot_id" TO "lot_id";--> statement-breakpoint
ALTER TABLE "payments" RENAME COLUMN "uuid_lot_id" TO "lot_id";--> statement-breakpoint
ALTER TABLE "lots" RENAME COLUMN "uuid_id" TO "id";--> statement-breakpoint
ALTER TABLE "bids" ALTER COLUMN "lot_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "lots_attributes" ALTER COLUMN "lot_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "lot_delivery_options" ALTER COLUMN "lot_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "lot_images" ALTER COLUMN "lot_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "lot_views" ALTER COLUMN "lot_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "lot_watchers" ALTER COLUMN "lot_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "lot_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "lots" ADD CONSTRAINT "lots_pkey" PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "lots_attributes" ADD CONSTRAINT "lots_attributes_lot_id_category_attribute_id_pk" PRIMARY KEY ("lot_id","category_attribute_id");--> statement-breakpoint
ALTER TABLE "lot_delivery_options" ADD CONSTRAINT "lot_delivery_options_lot_id_delivery_method_id_pk" PRIMARY KEY ("lot_id","delivery_method_id");--> statement-breakpoint
ALTER TABLE "lot_views" ADD CONSTRAINT "lot_views_lot_id_visitor_id_pk" PRIMARY KEY ("lot_id","visitor_id");--> statement-breakpoint
ALTER TABLE "lot_watchers" ADD CONSTRAINT "lot_watchers_lot_id_user_id_pk" PRIMARY KEY ("lot_id","user_id");--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_lot_id_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lots_attributes" ADD CONSTRAINT "lots_attributes_lot_id_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lot_delivery_options" ADD CONSTRAINT "lot_delivery_options_lot_id_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lot_images" ADD CONSTRAINT "lot_images_lot_id_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lot_views" ADD CONSTRAINT "lot_views_lot_id_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lot_watchers" ADD CONSTRAINT "lot_watchers_lot_id_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_lot_id_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bids_lot_amount_idx" ON "bids" USING btree ("lot_id","amount");--> statement-breakpoint
CREATE INDEX "bids_lot_top_idx" ON "bids" USING btree ("lot_id","amount" DESC);--> statement-breakpoint
CREATE UNIQUE INDEX "lot_views_user_idx" ON "lot_views" USING btree ("lot_id","user_id") WHERE "lot_views"."user_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "payments_lot_active_idx" ON "payments" USING btree ("lot_id") WHERE "payments"."status" in ('created','processing','succeeded');
