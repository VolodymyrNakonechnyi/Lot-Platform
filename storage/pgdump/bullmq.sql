--
-- PostgreSQL database dump
--

\restrict StrtbcmAKs9RRS7eqcMM2xgAYaaGVviariJ0qebvdtP051GtyL73QL1Uji6EdQR

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: user
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO "user";

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: user
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


ALTER TABLE drizzle.__drizzle_migrations OWNER TO "user";

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: user
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO "user";

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: user
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: bids; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.bids (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    lot_id uuid NOT NULL,
    CONSTRAINT bid_amount_positive CHECK ((amount > (0)::numeric))
);


ALTER TABLE public.bids OWNER TO "user";

--
-- Name: bids_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.bids_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bids_id_seq OWNER TO "user";

--
-- Name: bids_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.bids_id_seq OWNED BY public.bids.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.categories (
    id smallint NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    parent_id smallint
);


ALTER TABLE public.categories OWNER TO "user";

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

ALTER TABLE public.categories ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: category_attribute_options; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.category_attribute_options (
    id integer NOT NULL,
    attribute_id integer NOT NULL,
    value text NOT NULL,
    label text NOT NULL,
    sort_order smallint DEFAULT 0 NOT NULL
);


ALTER TABLE public.category_attribute_options OWNER TO "user";

--
-- Name: category_attribute_options_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

ALTER TABLE public.category_attribute_options ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.category_attribute_options_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: category_attributes; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.category_attributes (
    id integer NOT NULL,
    category_id smallint NOT NULL,
    key text NOT NULL,
    label text NOT NULL,
    type text NOT NULL,
    unit text,
    required boolean DEFAULT false NOT NULL,
    filterable boolean DEFAULT false NOT NULL,
    multiple boolean DEFAULT false NOT NULL,
    CONSTRAINT category_attributes_type_valid CHECK ((type = ANY (ARRAY['string'::text, 'number'::text, 'date'::text, 'boolean'::text])))
);


ALTER TABLE public.category_attributes OWNER TO "user";

--
-- Name: category_attributes_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

ALTER TABLE public.category_attributes ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.category_attributes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: delivery_methods; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.delivery_methods (
    id smallint NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    sort_order smallint DEFAULT 0 NOT NULL
);


ALTER TABLE public.delivery_methods OWNER TO "user";

--
-- Name: delivery_methods_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

ALTER TABLE public.delivery_methods ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.delivery_methods_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: email_tokens; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.email_tokens (
    id text NOT NULL,
    purpose text NOT NULL,
    user_id uuid NOT NULL,
    email text NOT NULL,
    fingerprint text,
    created_at timestamp with time zone NOT NULL,
    expires_at timestamp with time zone NOT NULL
);


ALTER TABLE public.email_tokens OWNER TO "user";

--
-- Name: lot_delivery_options; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.lot_delivery_options (
    delivery_method_id smallint NOT NULL,
    payment text NOT NULL,
    note text,
    lot_id uuid NOT NULL,
    CONSTRAINT delivery_payment_valid CHECK ((payment = ANY (ARRAY['on_agreement'::text, 'full_prepayment'::text, 'partial_prepayment'::text, 'on_receipt'::text, 'not_provided'::text])))
);


ALTER TABLE public.lot_delivery_options OWNER TO "user";

--
-- Name: lot_images; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.lot_images (
    id integer NOT NULL,
    url text NOT NULL,
    sort_order smallint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    lot_id uuid NOT NULL
);


ALTER TABLE public.lot_images OWNER TO "user";

--
-- Name: lot_images_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.lot_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lot_images_id_seq OWNER TO "user";

--
-- Name: lot_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.lot_images_id_seq OWNED BY public.lot_images.id;


--
-- Name: lot_views; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.lot_views (
    visitor_id uuid NOT NULL,
    user_id uuid,
    viewed_at timestamp with time zone DEFAULT now() NOT NULL,
    lot_id uuid NOT NULL
);


ALTER TABLE public.lot_views OWNER TO "user";

--
-- Name: lot_watchers; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.lot_watchers (
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    lot_id uuid NOT NULL
);


ALTER TABLE public.lot_watchers OWNER TO "user";

--
-- Name: lots; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.lots (
    name text NOT NULL,
    category_id smallint NOT NULL,
    seller_id uuid NOT NULL,
    buyer_id uuid,
    status text DEFAULT 'draft'::text NOT NULL,
    start_price numeric(12,2) NOT NULL,
    sold_price numeric(12,2),
    min_bid_step numeric(12,2) DEFAULT 1.00 NOT NULL,
    description text,
    return_policy text,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT uuidv7() CONSTRAINT lots_uuid_id_not_null NOT NULL,
    CONSTRAINT end_date_valid CHECK ((start_date < end_date)),
    CONSTRAINT role_valid CHECK ((status = ANY (ARRAY['draft'::text, 'pending'::text, 'published'::text, 'rejected'::text, 'reserved'::text, 'sold'::text, 'expired'::text, 'cancelled'::text, 'blocked'::text])))
);


ALTER TABLE public.lots OWNER TO "user";

--
-- Name: lots_attributes; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.lots_attributes (
    category_attribute_id integer NOT NULL,
    value text NOT NULL,
    lot_id uuid NOT NULL
);


ALTER TABLE public.lots_attributes OWNER TO "user";

--
-- Name: magic_links; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.magic_links (
    id text NOT NULL,
    email text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    redirect_to text
);


ALTER TABLE public.magic_links OWNER TO "user";

--
-- Name: mfa_authenticators; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.mfa_authenticators (
    user_id uuid NOT NULL,
    secret text NOT NULL,
    confirmed boolean NOT NULL,
    pending_secret text,
    last_used_step integer
);


ALTER TABLE public.mfa_authenticators OWNER TO "user";

--
-- Name: mfa_failures; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.mfa_failures (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    failed_at timestamp with time zone NOT NULL
);


ALTER TABLE public.mfa_failures OWNER TO "user";

--
-- Name: mfa_failures_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

ALTER TABLE public.mfa_failures ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.mfa_failures_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: mfa_recovery_codes; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.mfa_recovery_codes (
    user_id uuid NOT NULL,
    code_hash text NOT NULL
);


ALTER TABLE public.mfa_recovery_codes OWNER TO "user";

--
-- Name: oidc_logins; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.oidc_logins (
    state text NOT NULL,
    provider text NOT NULL,
    code_verifier text NOT NULL,
    nonce text,
    redirect_to text,
    link_user_id uuid,
    link_session_id text,
    created_at timestamp with time zone NOT NULL,
    expires_at timestamp with time zone NOT NULL
);


ALTER TABLE public.oidc_logins OWNER TO "user";

--
-- Name: payments; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.payments (
    id uuid DEFAULT uuidv7() NOT NULL,
    payer_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    status text DEFAULT 'created'::text NOT NULL,
    provider text NOT NULL,
    external_id text,
    provider_payload jsonb,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    lot_id uuid NOT NULL,
    CONSTRAINT payment_amount_positive CHECK ((amount > (0)::numeric)),
    CONSTRAINT payment_status_valid CHECK ((status = ANY (ARRAY['created'::text, 'processing'::text, 'succeeded'::text, 'failed'::text, 'expired'::text, 'refunded'::text])))
);


ALTER TABLE public.payments OWNER TO "user";

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.refresh_tokens (
    id text NOT NULL,
    family_id text NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    family_expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    revoked boolean DEFAULT false NOT NULL,
    claims jsonb
);


ALTER TABLE public.refresh_tokens OWNER TO "user";

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.sessions (
    id text NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    last_active_at timestamp with time zone NOT NULL,
    mfa text,
    metadata jsonb
);


ALTER TABLE public.sessions OWNER TO "user";

--
-- Name: user_identities; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.user_identities (
    provider text NOT NULL,
    subject text NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_identities OWNER TO "user";

--
-- Name: users; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.users (
    id uuid DEFAULT uuidv7() NOT NULL,
    username text,
    avatar_url text,
    role text DEFAULT 'user'::text NOT NULL,
    password text,
    email text NOT NULL,
    confirmed_email boolean DEFAULT false NOT NULL,
    name text,
    phone_number text,
    confirmed_phone_number boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_login timestamp with time zone,
    CONSTRAINT phone_format CHECK ((phone_number ~ '^[1-9][0-9]{6,14}$'::text)),
    CONSTRAINT role_valid CHECK ((role = ANY (ARRAY['user'::text, 'moderator'::text, 'admin'::text])))
);


ALTER TABLE public.users OWNER TO "user";

--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: user
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Name: bids id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.bids ALTER COLUMN id SET DEFAULT nextval('public.bids_id_seq'::regclass);


--
-- Name: lot_images id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lot_images ALTER COLUMN id SET DEFAULT nextval('public.lot_images_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: user
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
1	e0c9f8a34183b34656bbe1494e6d14b940768b2a2eda5c963c02d050961f22cf	1788638980677
2	36cd229db9c26c4e42238baa6a1ab3ca6a8e7c14e42da3135688fd296626a63b	1788968231621
5	cbc143dac4644076d6f1ed2e9a3fe3867744f2e756e287182120b3c29e1a159c	1792403133107
6	db716c5f0febff28ec0f0ef5521a71651e3e2d59d2814df5372984ab6b572601	1792491698253
7	1f03358c0d5495d2663a3d562f4ea66600d48a90a40037dda6e69157170431a2	1793139791800
9	756886cce39746f1665f36f8421a03375991b94cb16100a1c59ebe3160e18a86	1793184607088
10	77fa083a9c69c4ee4737ed14fe9b5feb06dbe9f9153ac61892adbcf94bcd9879	1793487005800
11	9823c7a26258f711c27738b79e5e8527b4b9d1f4a6f96073dc27662dbcf4e376	1793731654912
13	9a59a302812c8187ee0f05874c76bc7ba3b5fb670ec3cedaf5b7fbe63a870fe1	1793801133629
14	9dfe839b93613419e1ed67e7fb79dbadf1088e066dfcd23bfd0b92eb928f3e2a	1794419903958
15	ec322a24a42e38fdd39c31835970df39c7214455872f52389ee8d80c14c858e1	1794484350354
16	394422f50442ad513739e88bfb602093070f993974864a52a255ce79ee368326	1794995769214
\.


--
-- Data for Name: bids; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.bids (id, user_id, amount, created_at, lot_id) FROM stdin;
1	01a15399-8fa9-73cd-8be9-bc3b98cb63f9	48500.00	2026-11-03 21:43:28.784+00	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
2	01a15399-8fa9-7320-926a-41596b0b576d	49000.00	2026-11-04 02:43:28.784+00	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
3	01a15399-8fa9-73cd-8be9-bc3b98cb63f9	49500.00	2026-11-04 19:43:28.784+00	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
4	01a15f22-2552-7c70-b146-97cedc582065	50500.00	2026-11-05 22:43:28.784+00	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
5	01a19e07-27a6-7411-99af-d5fbbc8e6792	52000.00	2026-11-07 04:43:28.784+00	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
6	01a15399-8fa9-7320-926a-41596b0b576d	53500.00	2026-11-08 23:43:28.784+00	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
7	01a15f22-2552-7c70-b146-97cedc582065	33000.00	2026-11-07 18:43:28.784+00	01a1cf9b-5921-720e-a883-5928885b63f1
8	01a15f22-2552-7c70-b146-97cedc582065	31750.00	2026-11-03 23:43:28.784+00	01a1cf9b-5921-720e-a883-5928885b63f1
9	01a1637b-ef9f-70d0-ba39-10e7360702e7	32500.00	2026-11-06 01:43:28.784+00	01a1cf9b-5921-720e-a883-5928885b63f1
10	01a15399-8fa9-73cd-8be9-bc3b98cb63f9	32000.00	2026-11-04 20:43:28.784+00	01a1cf9b-5921-720e-a883-5928885b63f1
11	01a19e07-27a6-7411-99af-d5fbbc8e6792	66000.00	2026-11-09 00:43:28.784+00	01a1cf9b-5921-7244-966f-7a73697a9528
12	01a15399-8fa9-714d-a364-51c066faef24	64000.00	2026-11-05 17:43:28.784+00	01a1cf9b-5921-7244-966f-7a73697a9528
13	01a15399-8fa9-7320-926a-41596b0b576d	68000.00	2026-11-10 18:13:28.784+00	01a1cf9b-5921-7244-966f-7a73697a9528
14	01a15399-8fa9-7320-926a-41596b0b576d	63000.00	2026-11-04 05:43:28.784+00	01a1cf9b-5921-7244-966f-7a73697a9528
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.categories (id, name, slug, parent_id) FROM stdin;
1	Ноутбуки	laptops	\N
\.


--
-- Data for Name: category_attribute_options; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.category_attribute_options (id, attribute_id, value, label, sort_order) FROM stdin;
1	1	Apple	Apple	0
2	1	Lenovo	Lenovo	1
3	1	ASUS	ASUS	2
4	1	Dell	Dell	3
5	1	HP	HP	4
6	1	Acer	Acer	5
7	1	MSI	MSI	6
8	1	інший	інший	7
9	8	SSD NVMe	SSD NVMe	0
10	8	SSD SATA	SSD SATA	1
11	8	HDD	HDD	2
12	8	eMMC	eMMC	3
13	11	1366x768	1366x768	0
14	11	1920x1080	1920x1080	1
15	11	2560x1440	2560x1440	2
16	11	2560x1600	2560x1600	3
17	11	2880x1800	2880x1800	4
18	11	3024x1964	3024x1964	5
19	11	3456x2234	3456x2234	6
20	13	macOS	macOS	0
21	13	Windows 11	Windows 11	1
22	13	Windows 10	Windows 10	2
23	13	Linux	Linux	3
24	13	без ОС	без ОС	4
25	14	новий	новий	0
26	14	як новий	як новий	1
27	14	вживаний	вживаний	2
28	14	на запчастини	на запчастини	3
29	17	USB-A	USB-A	0
30	17	USB-C	USB-C	1
31	17	Thunderbolt	Thunderbolt	2
32	17	HDMI	HDMI	3
33	17	SD / microSD	SD / microSD	4
34	17	Ethernet	Ethernet	5
35	17	Jack 3.5	Jack 3.5	6
\.


--
-- Data for Name: category_attributes; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.category_attributes (id, category_id, key, label, type, unit, required, filterable, multiple) FROM stdin;
2	1	model	Модель	string	\N	t	f	f
3	1	release_year	Рік випуску	number	\N	t	t	f
4	1	cpu	Процесор	string	\N	t	t	f
5	1	cpu_cores	Ядер процесора	number	шт	f	t	f
6	1	ram_gb	Оперативна памʼять	number	ГБ	t	t	f
7	1	storage_gb	Накопичувач	number	ГБ	t	t	f
9	1	gpu	Відеокарта	string	\N	f	t	f
10	1	screen_inches	Діагональ екрана	number	″	t	t	f
12	1	refresh_rate_hz	Частота оновлення	number	Гц	f	t	f
15	1	battery_cycles	Циклів батареї	number	шт	f	f	f
16	1	weight_kg	Вага	number	кг	f	t	f
18	1	backlit_keyboard	Підсвітка клавіатури	boolean	\N	f	t	f
19	1	touchscreen	Сенсорний екран	boolean	\N	f	t	f
20	1	warranty_months	Гарантія	number	міс	f	t	f
1	1	brand	Бренд	string	\N	t	t	f
8	1	storage_type	Тип накопичувача	string	\N	t	t	f
11	1	screen_resolution	Роздільна здатність	string	\N	f	t	f
13	1	os	Операційна система	string	\N	f	t	f
14	1	condition	Стан	string	\N	t	t	f
17	1	ports	Порти	string	\N	f	t	t
\.


--
-- Data for Name: delivery_methods; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.delivery_methods (id, name, slug, sort_order) FROM stdin;
1	Нова Пошта	nova-poshta	0
2	Укрпошта	ukrposhta	1
3	Самовивіз	pickup	2
\.


--
-- Data for Name: email_tokens; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.email_tokens (id, purpose, user_id, email, fingerprint, created_at, expires_at) FROM stdin;
tp-0cyv2ESG1agFAihUl6JgwPRN04duX3eeU8DibZwM	password-reset	01a1637b-ef9f-70d0-ba39-10e7360702e7	volodymyr.nakonechnyi28@gmail.com	osA3FzYeOjmP5ilD_qPJgQDjNKIiY5FA9yB0fq7XQwI	2026-11-02 20:46:09.686+00	2026-11-02 21:46:09.686+00
vgEgRqazH8D004yBTB-wbf5JcMWwyqpuk9DotC1N1m0	email-verification	01a19e07-27a6-7411-99af-d5fbbc8e6792	heavylampa7893@gmail.com	\N	2026-11-02 20:50:31.474+00	2026-11-03 20:50:31.474+00
5YCIB3NGJsUkpLXY0FszIto6cToRo3bFF_WntxZ1nzM	email-verification	01a19e07-27a6-7411-99af-d5fbbc8e6792	heavylampa7893@gmail.com	\N	2026-11-02 20:59:06.095+00	2026-11-03 20:59:06.095+00
f40YAadrkzjlRCdGVyyeAPRJ2kxMttk9LGv7uLA_NyY	email-verification	01a19e07-27a6-7411-99af-d5fbbc8e6792	heavylampa7893@gmail.com	\N	2026-11-02 21:08:21.75+00	2026-11-03 21:08:21.75+00
STwywj9kWQE_puo1EHO0cyWrbd58TiRaVc6Twaa7ia8	email-verification	01a19e07-27a6-7411-99af-d5fbbc8e6792	heavylampa7893@gmail.com	\N	2026-11-02 21:08:50.111+00	2026-11-03 21:08:50.111+00
xJwLksZC4Jgke07r_VMTFQIWRsLlbUK0BOsjbzzHzJk	email-verification	01a19e07-27a6-7411-99af-d5fbbc8e6792	heavylampa7893@gmail.com	\N	2026-11-02 21:08:53.886+00	2026-11-03 21:08:53.886+00
\.


--
-- Data for Name: lot_delivery_options; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.lot_delivery_options (delivery_method_id, payment, note, lot_id) FROM stdin;
1	on_agreement	\N	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
1	on_agreement	\N	01a1cf9b-5921-720e-a883-5928885b63f1
1	on_agreement	\N	01a1cf9b-5921-7244-966f-7a73697a9528
2	on_agreement	\N	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
2	on_agreement	\N	01a1cf9b-5921-720e-a883-5928885b63f1
2	on_agreement	\N	01a1cf9b-5921-7244-966f-7a73697a9528
3	on_receipt	Київ, самовивіз після оплати	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
3	on_receipt	Київ, самовивіз після оплати	01a1cf9b-5921-720e-a883-5928885b63f1
3	on_receipt	Київ, самовивіз після оплати	01a1cf9b-5921-7244-966f-7a73697a9528
\.


--
-- Data for Name: lot_images; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.lot_images (id, url, sort_order, created_at, lot_id) FROM stdin;
1	https://localhost:9000/lot-images/lots/01a1cf9b-5921-7009-95d3-5bb4f5ca1008/43f8cf29-4acf-4aef-b764-ae326e5a275d.webp	0	2026-11-16 10:04:53.520157+00	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
2	https://localhost:9000/lot-images/lots/01a1cf9b-5921-7009-95d3-5bb4f5ca1008/6b34d7c0-951e-4cb4-b681-0ab49945d9b3.webp	1	2026-11-16 10:04:53.520157+00	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
3	https://localhost:9000/lot-images/lots/01a1cf9b-5921-7009-95d3-5bb4f5ca1008/4870ddbb-0d9d-4d1a-a269-2b9070fde2c7.webp	2	2026-11-16 10:04:53.520157+00	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
4	https://localhost:9000/lot-images/lots/01a1cf9b-5921-7009-95d3-5bb4f5ca1008/73b2c281-04a0-4c9f-a0d6-cea683fbfcd4.webp	3	2026-11-16 10:04:53.520157+00	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
5	https://localhost:9000/lot-images/lots/01a1cf9b-5921-720e-a883-5928885b63f1/43ad3e60-33d6-4e58-ac2a-8dd1d43f8cbe.webp	0	2026-11-16 10:04:55.057838+00	01a1cf9b-5921-720e-a883-5928885b63f1
6	https://localhost:9000/lot-images/lots/01a1cf9b-5921-720e-a883-5928885b63f1/0079326f-fb75-454f-8a25-cad78379b0b5.webp	1	2026-11-16 10:04:55.057838+00	01a1cf9b-5921-720e-a883-5928885b63f1
7	https://localhost:9000/lot-images/lots/01a1cf9b-5921-720e-a883-5928885b63f1/e7a33e6b-ba38-4fd5-b471-220d09ed1660.webp	2	2026-11-16 10:04:55.057838+00	01a1cf9b-5921-720e-a883-5928885b63f1
8	https://localhost:9000/lot-images/lots/01a1cf9b-5921-720e-a883-5928885b63f1/5aa6d3a6-f241-49b2-8bbc-84dee4350e12.webp	3	2026-11-16 10:04:55.057838+00	01a1cf9b-5921-720e-a883-5928885b63f1
9	https://localhost:9000/lot-images/lots/01a1cf9b-5921-7244-966f-7a73697a9528/eb9c0bb3-179e-4533-af63-092a1a937884.webp	0	2026-11-16 10:04:56.487035+00	01a1cf9b-5921-7244-966f-7a73697a9528
10	https://localhost:9000/lot-images/lots/01a1cf9b-5921-7244-966f-7a73697a9528/16c4a373-b4a4-4405-8b8f-8781bb2c239a.webp	1	2026-11-16 10:04:56.487035+00	01a1cf9b-5921-7244-966f-7a73697a9528
11	https://localhost:9000/lot-images/lots/01a1cf9b-5921-7244-966f-7a73697a9528/804faaeb-c45b-4f94-8509-15f69f3b0c37.webp	2	2026-11-16 10:04:56.487035+00	01a1cf9b-5921-7244-966f-7a73697a9528
12	https://localhost:9000/lot-images/lots/01a1cf9b-5921-7244-966f-7a73697a9528/a7902081-e87e-4f63-b996-3166cfeee82e.webp	3	2026-11-16 10:04:56.487035+00	01a1cf9b-5921-7244-966f-7a73697a9528
\.


--
-- Data for Name: lot_views; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.lot_views (visitor_id, user_id, viewed_at, lot_id) FROM stdin;
\.


--
-- Data for Name: lot_watchers; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.lot_watchers (user_id, created_at, lot_id) FROM stdin;
\.


--
-- Data for Name: lots; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.lots (name, category_id, seller_id, buyer_id, status, start_price, sold_price, min_bid_step, description, return_policy, start_date, end_date, updated_at, created_at, id) FROM stdin;
MacBook Pro 14 M3 Pro 18/512, 2023	1	01a15399-8fa9-7259-9412-fc60c318201a	\N	published	48000.00	\N	500.00	Куплений у квітні 2024, користувався вдома для розробки. Комплект повний: коробка, зарядка 96W, кабель. Без подряпин, плівка на екрані з магазину.	Повернення 14 днів за рахунок покупця, якщо стан не збігся.	2026-11-03 17:43:28.784	2026-11-10 17:43:28.784	2026-11-03 17:43:28.785808+00	2026-11-03 17:43:28.785808+00	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
Lenovo ThinkPad X1 Carbon Gen 11, i7-1365U 32/1TB	1	01a15399-8fa9-7320-926a-41596b0b576d	\N	published	31500.00	\N	250.00	Корпоративна машина, списана з балансу. Батарея тримає близько 6 годин у офісному сценарії. Є потертість на кришці біля завіси, на фото останнім кадром.	Без повернення, огляд перед оплатою в Києві можливий.	2026-11-03 17:43:28.784	2026-11-08 17:43:28.784	2026-11-03 17:43:28.839632+00	2026-11-03 17:43:28.839632+00	01a1cf9b-5921-720e-a883-5928885b63f1
ASUS ROG Zephyrus G14 GA402XY, RTX 4090 Laptop	1	01a15399-8fa9-7259-9412-fc60c318201a	\N	published	62000.00	\N	1000.00	Ігровий, куплений для стримів, продаю через перехід на десктоп. Термопаста замінена в серпні, температури під Cyberpunk до 87°C. Клавіатура AniMe Matrix на кришці.	Повернення 7 днів, пересилання ділимо навпіл.	2026-11-03 17:43:28.784	2026-11-13 17:43:28.784	2026-11-03 17:43:28.847869+00	2026-11-03 17:43:28.847869+00	01a1cf9b-5921-7244-966f-7a73697a9528
\.


--
-- Data for Name: lots_attributes; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.lots_attributes (category_attribute_id, value, lot_id) FROM stdin;
2	MacBook Pro 14 (A2992)	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
3	2023	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
4	Apple M3 Pro	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
5	11	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
6	18	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
7	512	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
9	Apple M3 Pro 14-core GPU	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
10	14.2	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
12	120	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
15	96	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
16	1.61	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
18	true	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
19	false	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
20	4	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
2	ThinkPad X1 Carbon Gen 11 (21HM)	01a1cf9b-5921-720e-a883-5928885b63f1
3	2023	01a1cf9b-5921-720e-a883-5928885b63f1
4	Intel Core i7-1365U	01a1cf9b-5921-720e-a883-5928885b63f1
5	10	01a1cf9b-5921-720e-a883-5928885b63f1
6	32	01a1cf9b-5921-720e-a883-5928885b63f1
7	1024	01a1cf9b-5921-720e-a883-5928885b63f1
9	Intel Iris Xe Graphics	01a1cf9b-5921-720e-a883-5928885b63f1
10	14	01a1cf9b-5921-720e-a883-5928885b63f1
12	120	01a1cf9b-5921-720e-a883-5928885b63f1
15	412	01a1cf9b-5921-720e-a883-5928885b63f1
16	1.12	01a1cf9b-5921-720e-a883-5928885b63f1
18	true	01a1cf9b-5921-720e-a883-5928885b63f1
19	false	01a1cf9b-5921-720e-a883-5928885b63f1
20	0	01a1cf9b-5921-720e-a883-5928885b63f1
2	ROG Zephyrus G14 GA402XY	01a1cf9b-5921-7244-966f-7a73697a9528
3	2023	01a1cf9b-5921-7244-966f-7a73697a9528
4	AMD Ryzen 9 7940HS	01a1cf9b-5921-7244-966f-7a73697a9528
5	8	01a1cf9b-5921-7244-966f-7a73697a9528
6	32	01a1cf9b-5921-7244-966f-7a73697a9528
7	2048	01a1cf9b-5921-7244-966f-7a73697a9528
9	NVIDIA GeForce RTX 4090 Laptop 16GB	01a1cf9b-5921-7244-966f-7a73697a9528
10	14	01a1cf9b-5921-7244-966f-7a73697a9528
12	165	01a1cf9b-5921-7244-966f-7a73697a9528
15	188	01a1cf9b-5921-7244-966f-7a73697a9528
16	1.72	01a1cf9b-5921-7244-966f-7a73697a9528
18	true	01a1cf9b-5921-7244-966f-7a73697a9528
19	true	01a1cf9b-5921-7244-966f-7a73697a9528
20	18	01a1cf9b-5921-7244-966f-7a73697a9528
1	Apple	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
8	SSD NVMe	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
11	3024x1964	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
13	macOS	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
14	як новий	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
17	USB-C, Thunderbolt, HDMI, SD / microSD, Jack 3.5	01a1cf9b-5921-7009-95d3-5bb4f5ca1008
1	Lenovo	01a1cf9b-5921-720e-a883-5928885b63f1
8	SSD NVMe	01a1cf9b-5921-720e-a883-5928885b63f1
11	2880x1800	01a1cf9b-5921-720e-a883-5928885b63f1
13	Windows 11	01a1cf9b-5921-720e-a883-5928885b63f1
14	вживаний	01a1cf9b-5921-720e-a883-5928885b63f1
17	USB-A, USB-C, Thunderbolt, HDMI, Jack 3.5	01a1cf9b-5921-720e-a883-5928885b63f1
1	ASUS	01a1cf9b-5921-7244-966f-7a73697a9528
8	SSD NVMe	01a1cf9b-5921-7244-966f-7a73697a9528
11	2560x1600	01a1cf9b-5921-7244-966f-7a73697a9528
13	Windows 11	01a1cf9b-5921-7244-966f-7a73697a9528
14	вживаний	01a1cf9b-5921-7244-966f-7a73697a9528
17	USB-A, USB-C, HDMI, SD / microSD, Jack 3.5	01a1cf9b-5921-7244-966f-7a73697a9528
\.


--
-- Data for Name: magic_links; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.magic_links (id, email, created_at, expires_at, redirect_to) FROM stdin;
4ZUR-MlJM4-iTnkmT79Cr6XiKiZ67mbf8XxMW4GFCts	store-smoke-1793487295996@example.com	2026-10-31 22:54:57.668+00	2026-10-31 23:09:57.668+00	\N
\.


--
-- Data for Name: mfa_authenticators; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.mfa_authenticators (user_id, secret, confirmed, pending_secret, last_used_step) FROM stdin;
\.


--
-- Data for Name: mfa_failures; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.mfa_failures (id, user_id, failed_at) FROM stdin;
\.


--
-- Data for Name: mfa_recovery_codes; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.mfa_recovery_codes (user_id, code_hash) FROM stdin;
\.


--
-- Data for Name: oidc_logins; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.oidc_logins (state, provider, code_verifier, nonce, redirect_to, link_user_id, link_session_id, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.payments (id, payer_id, amount, status, provider, external_id, provider_payload, description, created_at, updated_at, lot_id) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.refresh_tokens (id, family_id, user_id, created_at, expires_at, family_expires_at, used_at, revoked, claims) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.sessions (id, user_id, created_at, expires_at, last_active_at, mfa, metadata) FROM stdin;
uKcTL7Yo9TLjbK0x8oBHLc82WxOKJMv1Gvzgbg9kFlQ	01a15399-8fa9-7259-9412-fc60c318201a	2026-11-17 13:16:24.768+00	2026-12-01 13:16:24.768+00	2026-11-17 13:16:24.768+00	\N	{"ip": "127.0.0.1", "userAgent": "curl/8.5.0"}
H9Uys9_z4132rlnM0zKUCy32rcEvgrqpre3aWS4Ai9k	01a15399-8fa8-756f-9245-8aa8aee00111	2026-11-11 17:51:25.863+00	2026-11-25 17:51:25.863+00	2026-11-11 17:52:37.52+00	\N	{"ip": "::1", "userAgent": "curl/8.5.0"}
EqzVpno7Va4dPt7fEZd__BIx2EVIenXd9bnTw1WiafA	01a15399-8fa8-756f-9245-8aa8aee00111	2026-11-16 11:59:53.441+00	2026-11-30 11:59:53.441+00	2026-11-16 11:59:53.441+00	\N	{"ip": "127.0.0.1", "userAgent": "curl/8.5.0"}
2y0gyaTfSjjeuM3zpNhMe0s_mLOovP8s0wrzk-7jxXM	01a15399-8fa8-756f-9245-8aa8aee00111	2026-11-16 11:59:54.1+00	2026-11-30 11:59:54.1+00	2026-11-16 11:59:54.1+00	\N	{"ip": "127.0.0.1", "userAgent": "curl/8.5.0"}
Wflj1p2l_7_qKpDZOL_76ICp8ket0WHkoxzWTHVTTbY	01a15399-8fa8-756f-9245-8aa8aee00111	2026-11-16 22:45:40.072+00	2026-11-30 22:45:40.072+00	2026-11-16 22:45:40.072+00	\N	{"ip": "127.0.0.1", "userAgent": "curl/8.5.0"}
Dh7sqfedrB6Ol7Vpjog24AAcyulgsrSEpSY3Z3X5KBQ	01a15399-8fa8-756f-9245-8aa8aee00111	2026-11-17 11:53:23.339+00	2026-12-01 11:53:23.339+00	2026-11-17 11:53:23.339+00	\N	{"ip": "127.0.0.1", "userAgent": "curl/8.5.0"}
D3IRXFd0G4HO914-yOUwnGZVtSMoiI6HPZd2BNzsuFk	01a15399-8fa9-7259-9412-fc60c318201a	2026-11-17 12:42:14.478+00	2026-12-01 12:42:14.478+00	2026-11-17 12:42:14.478+00	\N	{"ip": "127.0.0.1", "userAgent": "curl/8.5.0"}
B9JZ9h_xDFq_LdA3-nMWw4u68z7FKVwV_sFyhvVP6v8	01a15399-8fa9-7320-926a-41596b0b576d	2026-11-17 13:16:25.311+00	2026-12-01 13:16:25.311+00	2026-11-17 13:16:25.311+00	\N	{"ip": "127.0.0.1", "userAgent": "curl/8.5.0"}
A-Pazm8AbdQRWPlzIpnDLikFSkAf0UFsj5Byc99pkts	01a15399-8fa9-7259-9412-fc60c318201a	2026-11-17 13:31:27.084+00	2026-12-01 13:31:27.084+00	2026-11-17 13:31:27.084+00	\N	{"ip": "127.0.0.1", "userAgent": "curl/8.5.0"}
p0VbotsG9i-QUjP8mRchsF0CFutgju67HCf9_GhnWRI	01a15399-8fa9-7259-9412-fc60c318201a	2026-11-17 13:33:07.114+00	2026-12-01 13:33:07.114+00	2026-11-17 13:33:07.114+00	\N	{"ip": "127.0.0.1", "userAgent": "curl/8.5.0"}
A1GrEVq44bVMXp28XsnIdreaCQ30VE0sNC2z1w4oeo8	01a15399-8fa9-7259-9412-fc60c318201a	2026-11-17 13:34:12.398+00	2026-12-01 13:34:12.398+00	2026-11-17 13:34:12.398+00	\N	{"ip": "127.0.0.1", "userAgent": "curl/8.5.0"}
\.


--
-- Data for Name: user_identities; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.user_identities (provider, subject, user_id, created_at) FROM stdin;
google	104916991148925507183	01a1637b-ef9f-70d0-ba39-10e7360702e7	2026-10-28 11:14:24.292742+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.users (id, username, avatar_url, role, password, email, confirmed_email, name, phone_number, confirmed_phone_number, updated_at, created_at, last_login) FROM stdin;
01a13fad-4f61-7d89-b14d-40ed5803e1a9	smoke_test	\N	user	$argon2id$v=19$m=65536,t=3,p=4$XA-HbmRjt9Ds-Ug6RBYsWg$x916ol7waIpJWYc0EXm3CLafrYo-7gx6EM7Sli4cpHo	smoke+1792069684@example.com	f	Smoke Test	\N	f	2026-10-15 13:08:05.08361+00	2026-10-15 13:08:05.08361+00	\N
01a13fad-69ea-7a7c-a46d-4ddc36d6f521	direct_1792069691	\N	user	x	direct+1792069691@example.com	f	Direct	\N	f	2026-10-15 13:08:11.881688+00	2026-10-15 13:08:11.881688+00	\N
01a15399-8fa8-756f-9245-8aa8aee00111	vova	\N	admin	$scrypt$ln=17,r=8,p=1$s21hQ6VM9j3UmYaUiGznzw$Efc5teaMWOq5XTSDg7WGiEQjoParV9xnJPOBTv3H0EU	vova@example.com	t	Vova	380671234501	f	2026-11-16 10:49:58.312+00	2026-10-19 09:58:55.142036+00	\N
01a15399-8fa9-714d-a364-51c066faef24	olena	\N	moderator	$scrypt$ln=17,r=8,p=1$HsB6NRsIk84nA1aYZ5QpMw$8Gr7S1irmK6wAjLwLOf6HtL3h9M+JjjgiynPUOb5EA4	olena@example.com	f	Olena	380671234502	f	2026-11-16 10:49:58.312+00	2026-10-19 09:58:55.142036+00	\N
01a15399-8fa9-7259-9412-fc60c318201a	taras	\N	user	$scrypt$ln=17,r=8,p=1$wZjnBD71N0Uex5Hs7BIHEA$LUidao5VxDAHcRJdphlRlS9I9+Jy1dRhCEocrWTlOPg	taras@example.com	f	Taras	380671234503	f	2026-11-16 10:49:58.312+00	2026-10-19 09:58:55.142036+00	\N
01a15399-8fa9-7320-926a-41596b0b576d	marta	\N	user	$scrypt$ln=17,r=8,p=1$UZmom+ZCFca0bFHSfTM/jg$LtYUB59DPY7XynRoq+1JdwsInnXqfA+exBCoV/UI7mE	marta@example.com	f	Marta	380671234504	f	2026-11-16 10:49:58.312+00	2026-10-19 09:58:55.142036+00	\N
01a15399-8fa9-73cd-8be9-bc3b98cb63f9	ihor	\N	user	$scrypt$ln=17,r=8,p=1$cfJUR3vYia/nzZa02Ojohg$ZPtuyhRnQY9A6cFbMDjrH7NvELHcqXVhhc+EvIzdoSo	ihor@example.com	f	Ihor	380671234505	f	2026-11-16 10:49:58.312+00	2026-10-19 09:58:55.142036+00	\N
01a15f22-2552-7c70-b146-97cedc582065	john_doe	\N	user	$scrypt$ln=17,r=8,p=1$Mbgna0z1cE13w9oC1za2yw$5Ni8uNl9PX2USk9egmZthwz/bhpHV/0ybcIk9VtZce4	john.doe@mail.com	f	John Doe	\N	f	2026-10-21 15:43:55.730334+00	2026-10-21 15:43:55.730334+00	\N
01a1637b-ef9f-70d0-ba39-10e7360702e7	volodymyr_nakonechnyi	\N	user	$scrypt$ln=17,r=8,p=1$VuEx4d+BHgJIZMZp7JB9EQ$uZrJq0rNaNkd3USZbLelXILb4H4NPAohh5H3Rkk+LgY	volodymyr.nakonechnyi28@gmail.com	t	Volodymyr Nakonechnyi	\N	f	2026-11-02 20:39:09.057+00	2026-10-22 12:00:29.086718+00	\N
01a19e07-27a6-7411-99af-d5fbbc8e6792	heavy_rain	\N	user	$scrypt$ln=17,r=8,p=1$ZZPlRYDGHjl0sqzVO3AMCw$YNZBoa/BnUpNMrV9O9JOSZBRMI8DtuWWY/Br4vPdOSM	heavylampa7893@gmail.com	f	Heavy Rain	\N	f	2026-11-02 20:50:31.461899+00	2026-11-02 20:50:31.461899+00	\N
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: user
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 16, true);


--
-- Name: bids_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.bids_id_seq', 15, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.categories_id_seq', 251, true);


--
-- Name: category_attribute_options_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.category_attribute_options_id_seq', 611, true);


--
-- Name: category_attributes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.category_attributes_id_seq', 534, true);


--
-- Name: delivery_methods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.delivery_methods_id_seq', 3, true);


--
-- Name: lot_images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.lot_images_id_seq', 17, true);


--
-- Name: mfa_failures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.mfa_failures_id_seq', 1, false);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: user
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: bids bids_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_unique; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_unique UNIQUE (slug);


--
-- Name: category_attribute_options category_attribute_options_attribute_id_value_unique; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.category_attribute_options
    ADD CONSTRAINT category_attribute_options_attribute_id_value_unique UNIQUE (attribute_id, value);


--
-- Name: category_attribute_options category_attribute_options_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.category_attribute_options
    ADD CONSTRAINT category_attribute_options_pkey PRIMARY KEY (id);


--
-- Name: category_attributes category_attributes_category_key_uq; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.category_attributes
    ADD CONSTRAINT category_attributes_category_key_uq UNIQUE (category_id, key);


--
-- Name: category_attributes category_attributes_id_category_uq; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.category_attributes
    ADD CONSTRAINT category_attributes_id_category_uq UNIQUE (id, category_id);


--
-- Name: category_attributes category_attributes_key_unique; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.category_attributes
    ADD CONSTRAINT category_attributes_key_unique UNIQUE (key);


--
-- Name: category_attributes category_attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.category_attributes
    ADD CONSTRAINT category_attributes_pkey PRIMARY KEY (id);


--
-- Name: delivery_methods delivery_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.delivery_methods
    ADD CONSTRAINT delivery_methods_pkey PRIMARY KEY (id);


--
-- Name: delivery_methods delivery_methods_slug_unique; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.delivery_methods
    ADD CONSTRAINT delivery_methods_slug_unique UNIQUE (slug);


--
-- Name: email_tokens email_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.email_tokens
    ADD CONSTRAINT email_tokens_pkey PRIMARY KEY (id);


--
-- Name: lot_delivery_options lot_delivery_options_lot_id_delivery_method_id_pk; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lot_delivery_options
    ADD CONSTRAINT lot_delivery_options_lot_id_delivery_method_id_pk PRIMARY KEY (lot_id, delivery_method_id);


--
-- Name: lot_images lot_images_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lot_images
    ADD CONSTRAINT lot_images_pkey PRIMARY KEY (id);


--
-- Name: lot_views lot_views_lot_id_visitor_id_pk; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lot_views
    ADD CONSTRAINT lot_views_lot_id_visitor_id_pk PRIMARY KEY (lot_id, visitor_id);


--
-- Name: lot_watchers lot_watchers_lot_id_user_id_pk; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lot_watchers
    ADD CONSTRAINT lot_watchers_lot_id_user_id_pk PRIMARY KEY (lot_id, user_id);


--
-- Name: lots_attributes lots_attributes_lot_id_category_attribute_id_pk; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lots_attributes
    ADD CONSTRAINT lots_attributes_lot_id_category_attribute_id_pk PRIMARY KEY (lot_id, category_attribute_id);


--
-- Name: lots lots_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lots
    ADD CONSTRAINT lots_pkey PRIMARY KEY (id);


--
-- Name: magic_links magic_links_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.magic_links
    ADD CONSTRAINT magic_links_pkey PRIMARY KEY (id);


--
-- Name: mfa_authenticators mfa_authenticators_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.mfa_authenticators
    ADD CONSTRAINT mfa_authenticators_pkey PRIMARY KEY (user_id);


--
-- Name: mfa_failures mfa_failures_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.mfa_failures
    ADD CONSTRAINT mfa_failures_pkey PRIMARY KEY (id);


--
-- Name: mfa_recovery_codes mfa_recovery_codes_user_id_code_hash_pk; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.mfa_recovery_codes
    ADD CONSTRAINT mfa_recovery_codes_user_id_code_hash_pk PRIMARY KEY (user_id, code_hash);


--
-- Name: oidc_logins oidc_logins_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.oidc_logins
    ADD CONSTRAINT oidc_logins_pkey PRIMARY KEY (state);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: user_identities user_identities_provider_subject_pk; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.user_identities
    ADD CONSTRAINT user_identities_provider_subject_pk PRIMARY KEY (provider, subject);


--
-- Name: users users_phone_number_unique; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_number_unique UNIQUE (phone_number);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: bids_lot_amount_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX bids_lot_amount_idx ON public.bids USING btree (lot_id, amount);


--
-- Name: bids_lot_top_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX bids_lot_top_idx ON public.bids USING btree (lot_id, amount DESC);


--
-- Name: bids_user_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX bids_user_idx ON public.bids USING btree (user_id, created_at DESC);


--
-- Name: categories_id_parent_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX categories_id_parent_idx ON public.categories USING btree (id, parent_id);


--
-- Name: email_tokens_expires_at_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX email_tokens_expires_at_idx ON public.email_tokens USING btree (expires_at);


--
-- Name: email_tokens_user_id_purpose_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX email_tokens_user_id_purpose_idx ON public.email_tokens USING btree (user_id, purpose);


--
-- Name: lav_attr_number_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX lav_attr_number_idx ON public.lots_attributes USING btree (category_attribute_id);


--
-- Name: lav_attr_value_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX lav_attr_value_idx ON public.lots_attributes USING btree (category_attribute_id, value);


--
-- Name: lot_delivery_options_method_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX lot_delivery_options_method_idx ON public.lot_delivery_options USING btree (delivery_method_id);


--
-- Name: lot_image_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX lot_image_idx ON public.lot_images USING btree (id, sort_order);


--
-- Name: lot_views_user_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX lot_views_user_idx ON public.lot_views USING btree (lot_id, user_id) WHERE (user_id IS NOT NULL);


--
-- Name: lot_watchers_user_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX lot_watchers_user_idx ON public.lot_watchers USING btree (user_id, created_at DESC);


--
-- Name: lots_buyer_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX lots_buyer_idx ON public.lots USING btree (buyer_id, id DESC NULLS LAST) WHERE (buyer_id IS NOT NULL);


--
-- Name: lots_published_category_end_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX lots_published_category_end_idx ON public.lots USING btree (category_id, end_date, id) WHERE (status = 'published'::text);


--
-- Name: lots_published_category_start_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX lots_published_category_start_idx ON public.lots USING btree (category_id, start_date DESC NULLS LAST, id DESC NULLS LAST) WHERE (status = 'published'::text);


--
-- Name: lots_published_end_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX lots_published_end_idx ON public.lots USING btree (end_date, id) WHERE (status = 'published'::text);


--
-- Name: lots_seller_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX lots_seller_idx ON public.lots USING btree (seller_id, id DESC NULLS LAST);


--
-- Name: magic_links_expires_at_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX magic_links_expires_at_idx ON public.magic_links USING btree (expires_at);


--
-- Name: mfa_failures_failed_at_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX mfa_failures_failed_at_idx ON public.mfa_failures USING btree (failed_at);


--
-- Name: mfa_failures_user_id_failed_at_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX mfa_failures_user_id_failed_at_idx ON public.mfa_failures USING btree (user_id, failed_at);


--
-- Name: oidc_logins_expires_at_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX oidc_logins_expires_at_idx ON public.oidc_logins USING btree (expires_at);


--
-- Name: payments_external_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX payments_external_idx ON public.payments USING btree (provider, external_id) WHERE (external_id IS NOT NULL);


--
-- Name: payments_lot_active_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX payments_lot_active_idx ON public.payments USING btree (lot_id) WHERE (status = ANY (ARRAY['created'::text, 'processing'::text, 'succeeded'::text]));


--
-- Name: refresh_tokens_family_expires_at_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX refresh_tokens_family_expires_at_idx ON public.refresh_tokens USING btree (family_expires_at);


--
-- Name: refresh_tokens_family_id_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX refresh_tokens_family_id_idx ON public.refresh_tokens USING btree (family_id);


--
-- Name: refresh_tokens_user_id_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX refresh_tokens_user_id_idx ON public.refresh_tokens USING btree (user_id);


--
-- Name: sessions_expires_at_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX sessions_expires_at_idx ON public.sessions USING btree (expires_at);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX sessions_user_id_idx ON public.sessions USING btree (user_id);


--
-- Name: user_identities_user_id_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX user_identities_user_id_idx ON public.user_identities USING btree (user_id);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX users_email_idx ON public.users USING btree (lower(email));


--
-- Name: bids bids_lot_id_lots_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_lot_id_lots_id_fk FOREIGN KEY (lot_id) REFERENCES public.lots(id) ON DELETE CASCADE;


--
-- Name: bids bids_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: categories categories_parent_id_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_categories_id_fk FOREIGN KEY (parent_id) REFERENCES public.categories(id);


--
-- Name: category_attribute_options category_attribute_options_attribute_id_category_attributes_id_; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.category_attribute_options
    ADD CONSTRAINT category_attribute_options_attribute_id_category_attributes_id_ FOREIGN KEY (attribute_id) REFERENCES public.category_attributes(id) ON DELETE CASCADE;


--
-- Name: category_attributes category_attributes_category_id_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.category_attributes
    ADD CONSTRAINT category_attributes_category_id_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: email_tokens email_tokens_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.email_tokens
    ADD CONSTRAINT email_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: lot_delivery_options lot_delivery_options_delivery_method_id_delivery_methods_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lot_delivery_options
    ADD CONSTRAINT lot_delivery_options_delivery_method_id_delivery_methods_id_fk FOREIGN KEY (delivery_method_id) REFERENCES public.delivery_methods(id);


--
-- Name: lot_delivery_options lot_delivery_options_lot_id_lots_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lot_delivery_options
    ADD CONSTRAINT lot_delivery_options_lot_id_lots_id_fk FOREIGN KEY (lot_id) REFERENCES public.lots(id);


--
-- Name: lot_images lot_images_lot_id_lots_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lot_images
    ADD CONSTRAINT lot_images_lot_id_lots_id_fk FOREIGN KEY (lot_id) REFERENCES public.lots(id) ON DELETE CASCADE;


--
-- Name: lot_views lot_views_lot_id_lots_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lot_views
    ADD CONSTRAINT lot_views_lot_id_lots_id_fk FOREIGN KEY (lot_id) REFERENCES public.lots(id) ON DELETE CASCADE;


--
-- Name: lot_views lot_views_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lot_views
    ADD CONSTRAINT lot_views_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: lot_watchers lot_watchers_lot_id_lots_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lot_watchers
    ADD CONSTRAINT lot_watchers_lot_id_lots_id_fk FOREIGN KEY (lot_id) REFERENCES public.lots(id) ON DELETE CASCADE;


--
-- Name: lot_watchers lot_watchers_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lot_watchers
    ADD CONSTRAINT lot_watchers_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: lots_attributes lots_attributes_category_attribute_id_category_attributes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lots_attributes
    ADD CONSTRAINT lots_attributes_category_attribute_id_category_attributes_id_fk FOREIGN KEY (category_attribute_id) REFERENCES public.category_attributes(id);


--
-- Name: lots_attributes lots_attributes_lot_id_lots_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lots_attributes
    ADD CONSTRAINT lots_attributes_lot_id_lots_id_fk FOREIGN KEY (lot_id) REFERENCES public.lots(id);


--
-- Name: lots lots_buyer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lots
    ADD CONSTRAINT lots_buyer_id_users_id_fk FOREIGN KEY (buyer_id) REFERENCES public.users(id);


--
-- Name: lots lots_category_id_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lots
    ADD CONSTRAINT lots_category_id_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: lots lots_seller_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lots
    ADD CONSTRAINT lots_seller_id_users_id_fk FOREIGN KEY (seller_id) REFERENCES public.users(id);


--
-- Name: mfa_authenticators mfa_authenticators_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.mfa_authenticators
    ADD CONSTRAINT mfa_authenticators_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: mfa_failures mfa_failures_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.mfa_failures
    ADD CONSTRAINT mfa_failures_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: mfa_recovery_codes mfa_recovery_codes_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.mfa_recovery_codes
    ADD CONSTRAINT mfa_recovery_codes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: oidc_logins oidc_logins_link_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.oidc_logins
    ADD CONSTRAINT oidc_logins_link_user_id_users_id_fk FOREIGN KEY (link_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payments payments_lot_id_lots_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_lot_id_lots_id_fk FOREIGN KEY (lot_id) REFERENCES public.lots(id);


--
-- Name: payments payments_payer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_payer_id_users_id_fk FOREIGN KEY (payer_id) REFERENCES public.users(id);


--
-- Name: refresh_tokens refresh_tokens_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_identities user_identities_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.user_identities
    ADD CONSTRAINT user_identities_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict StrtbcmAKs9RRS7eqcMM2xgAYaaGVviariJ0qebvdtP051GtyL73QL1Uji6EdQR

