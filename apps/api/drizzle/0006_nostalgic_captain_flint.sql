CREATE TABLE "category_attribute_options" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "category_attribute_options_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"attribute_id" integer NOT NULL,
	"value" text NOT NULL,
	"label" text NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "category_attribute_options_attribute_id_value_unique" UNIQUE("attribute_id","value")
);
--> statement-breakpoint
ALTER TABLE "category_attribute_options" ADD CONSTRAINT "category_attribute_options_attribute_id_category_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."category_attributes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "category_attribute_options" ("attribute_id", "value", "label", "sort_order")
SELECT ca."id", opt."value", opt."value", (opt."ordinality" - 1)::smallint
FROM "category_attributes" ca
CROSS JOIN LATERAL jsonb_array_elements_text(ca."options") WITH ORDINALITY AS opt("value", "ordinality")
WHERE ca."options" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "category_attributes" DROP COLUMN "options";