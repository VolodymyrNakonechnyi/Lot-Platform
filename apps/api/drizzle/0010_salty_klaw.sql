DROP INDEX "lots_published_category_idx";--> statement-breakpoint
CREATE INDEX "lots_published_category_end_idx" ON "lots" USING btree ("category_id","end_date","id") WHERE "lots"."status" = 'published';--> statement-breakpoint
CREATE INDEX "lots_published_category_start_idx" ON "lots" USING btree ("category_id","start_date" DESC NULLS LAST,"id" DESC NULLS LAST) WHERE "lots"."status" = 'published';--> statement-breakpoint
CREATE INDEX "lots_published_end_idx" ON "lots" USING btree ("end_date","id") WHERE "lots"."status" = 'published';--> statement-breakpoint
CREATE INDEX "lots_seller_idx" ON "lots" USING btree ("seller_id","id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "lots_buyer_idx" ON "lots" USING btree ("buyer_id","id" DESC NULLS LAST) WHERE "lots"."buyer_id" IS NOT NULL;