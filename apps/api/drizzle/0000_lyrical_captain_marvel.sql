CREATE TABLE "bids" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"lot_id" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bid_amount_positive" CHECK ("bids"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" smallint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 32767 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"parent_id" smallint,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "category_attributes" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" smallint NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"type" text NOT NULL,
	"options" jsonb,
	"unit" text,
	"required" boolean DEFAULT false NOT NULL,
	"filterable" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_methods" (
	"id" smallint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "delivery_methods_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 32767 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "delivery_methods_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "lots_attributes" (
	"lot_id" integer NOT NULL,
	"category_attribute_id" integer NOT NULL,
	"value" text NOT NULL,
	"value_number" numeric(12, 2),
	CONSTRAINT "lots_attributes_lot_id_category_attribute_id_pk" PRIMARY KEY("lot_id","category_attribute_id")
);
--> statement-breakpoint
CREATE TABLE "lot_delivery_options" (
	"lot_id" integer NOT NULL,
	"delivery_method_id" smallint NOT NULL,
	"payment" text NOT NULL,
	"note" text,
	CONSTRAINT "lot_delivery_options_lot_id_delivery_method_id_pk" PRIMARY KEY("lot_id","delivery_method_id"),
	CONSTRAINT "delivery_payment_valid" CHECK ("lot_delivery_options"."payment" IN ('on_agreement', 'full_prepayment', 'partial_prepayment', 'on_receipt', 'not_provided'))
);
--> statement-breakpoint
CREATE TABLE "lot_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lot_views" (
	"lot_id" integer NOT NULL,
	"visitor_id" uuid NOT NULL,
	"user_id" uuid,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lot_views_lot_id_visitor_id_pk" PRIMARY KEY("lot_id","visitor_id")
);
--> statement-breakpoint
CREATE TABLE "lot_watchers" (
	"lot_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lot_watchers_lot_id_user_id_pk" PRIMARY KEY("lot_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "lots" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category_id" smallint NOT NULL,
	"seller_id" uuid NOT NULL,
	"buyer_id" uuid,
	"status" text DEFAULT 'draft' NOT NULL,
	"start_price" numeric(12, 2) NOT NULL,
	"sold_price" numeric(12, 2),
	"current_price" numeric(12, 2),
	"min_bid_step" numeric(12, 2) DEFAULT '1.00' NOT NULL,
	"description" text,
	"return_policy" text,
	"watchers_count" integer DEFAULT 0 NOT NULL,
	"views_count" integer DEFAULT 0 NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_valid" CHECK ("lots"."status" IN ('draft', 'pending', 'published', 'rejected', 'reserved', 'sold', 'expired', 'cancelled', 'blocked')),
	CONSTRAINT "end_date_valid" CHECK ("lots"."start_date" < "lots"."end_date"),
	CONSTRAINT "watchers_count_valid" CHECK ("lots"."watchers_count" >= 0),
	CONSTRAINT "views_count_valid" CHECK ("lots"."views_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"lot_id" integer NOT NULL,
	"payer_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"status" text DEFAULT 'created' NOT NULL,
	"provider" text NOT NULL,
	"external_id" text,
	"provider_payload" jsonb,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_status_valid" CHECK ("payments"."status" IN ('created', 'processing', 'succeeded', 'failed', 'expired', 'refunded')),
	CONSTRAINT "payment_amount_positive" CHECK ("payments"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"username" text NOT NULL,
	"avatar_url" text,
	"role" text DEFAULT 'user' NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"confirmed_email" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL,
	"phone_number" text NOT NULL,
	"confirmed_phone_number" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login" timestamp with time zone,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_phone_number_unique" UNIQUE("phone_number"),
	CONSTRAINT "phone_format" CHECK ("users"."phone_number" ~ '^[1-9][0-9]{6,14}$'),
	CONSTRAINT "role_valid" CHECK ("users"."role" IN ('user', 'moderator', 'admin'))
);
--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_lot_id_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_attributes" ADD CONSTRAINT "category_attributes_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lots_attributes" ADD CONSTRAINT "lots_attributes_lot_id_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lots_attributes" ADD CONSTRAINT "lots_attributes_category_attribute_id_category_attributes_id_fk" FOREIGN KEY ("category_attribute_id") REFERENCES "public"."category_attributes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lot_delivery_options" ADD CONSTRAINT "lot_delivery_options_lot_id_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lot_delivery_options" ADD CONSTRAINT "lot_delivery_options_delivery_method_id_delivery_methods_id_fk" FOREIGN KEY ("delivery_method_id") REFERENCES "public"."delivery_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lot_views" ADD CONSTRAINT "lot_views_lot_id_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lot_views" ADD CONSTRAINT "lot_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lot_watchers" ADD CONSTRAINT "lot_watchers_lot_id_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lot_watchers" ADD CONSTRAINT "lot_watchers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lots" ADD CONSTRAINT "lots_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lots" ADD CONSTRAINT "lots_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lots" ADD CONSTRAINT "lots_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_lot_id_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_payer_id_users_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bids_lot_amount_idx" ON "bids" USING btree ("lot_id","amount");--> statement-breakpoint
CREATE INDEX "bids_lot_top_idx" ON "bids" USING btree ("lot_id","amount" DESC);--> statement-breakpoint
CREATE INDEX "bids_user_idx" ON "bids" USING btree ("user_id","created_at" DESC);--> statement-breakpoint
CREATE UNIQUE INDEX "categories_id_parent_idx" ON "categories" USING btree ("id","parent_id");--> statement-breakpoint
CREATE INDEX "lav_attr_value_idx" ON "lots_attributes" USING btree ("category_attribute_id","value");--> statement-breakpoint
CREATE INDEX "lav_attr_number_idx" ON "lots_attributes" USING btree ("category_attribute_id","value_number");--> statement-breakpoint
CREATE INDEX "lot_delivery_options_method_idx" ON "lot_delivery_options" USING btree ("delivery_method_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lot_image_idx" ON "lot_images" USING btree ("id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "lot_views_user_idx" ON "lot_views" USING btree ("lot_id","user_id") WHERE "lot_views"."user_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "lot_watchers_user_idx" ON "lot_watchers" USING btree ("user_id","created_at" DESC);--> statement-breakpoint
CREATE INDEX "lots_published_category_idx" ON "lots" USING btree ("category_id") WHERE "lots"."status" = 'published';--> statement-breakpoint
CREATE UNIQUE INDEX "payments_lot_active_idx" ON "payments" USING btree ("lot_id") WHERE "payments"."status" IN ('created', 'processing', 'succeeded');--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree (lower("email"));