DROP INDEX "lav_attr_number_idx";--> statement-breakpoint
ALTER TABLE "category_attributes" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "category_attributes" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
DROP SEQUENCE IF EXISTS "category_attributes_id_seq";--> statement-breakpoint
ALTER TABLE "category_attributes" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "category_attributes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1);--> statement-breakpoint
DO $$
DECLARE next_id bigint;
BEGIN
  SELECT coalesce(max("id"), 0) + 1 INTO next_id FROM "category_attributes";
  EXECUTE format('ALTER TABLE "category_attributes" ALTER COLUMN "id" RESTART WITH %s', next_id);
END $$;--> statement-breakpoint
ALTER TABLE "category_attributes" ADD COLUMN "multiple" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "category_attributes" SET "multiple" = true WHERE "type" = 'multiselect';--> statement-breakpoint
UPDATE "category_attributes" SET "type" = 'string' WHERE "type" IN ('select', 'multiselect');--> statement-breakpoint
CREATE INDEX "lav_attr_number_idx" ON "lots_attributes" USING btree ("category_attribute_id");--> statement-breakpoint
ALTER TABLE "lots_attributes" DROP COLUMN "value_number";--> statement-breakpoint
ALTER TABLE "category_attributes" ADD CONSTRAINT "category_attributes_category_key_uq" UNIQUE("category_id","key");--> statement-breakpoint
ALTER TABLE "category_attributes" ADD CONSTRAINT "category_attributes_id_category_uq" UNIQUE("id","category_id");--> statement-breakpoint
ALTER TABLE "category_attributes" ADD CONSTRAINT "category_attributes_type_valid" CHECK ("category_attributes"."type" IN ('string', 'number', 'date', 'boolean'));