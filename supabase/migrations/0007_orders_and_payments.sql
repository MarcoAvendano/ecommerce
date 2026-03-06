create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default public.generate_document_number('SO'),
  sales_channel text not null check (sales_channel in ('ecommerce', 'pos')),
  customer_id uuid references public.customers(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'pending', 'paid', 'partially_paid', 'cancelled', 'fulfilled', 'refunded')),
  currency text not null default 'MXN',
  subtotal_cents integer not null default 0,
  discount_cents integer not null default 0,
  tax_cents integer not null default 0,
  total_cents integer not null default 0,
  shipping_address jsonb not null default '{}'::jsonb,
  billing_address jsonb not null default '{}'::jsonb,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid references public.product_variants(id) on delete restrict,
  item_name text not null,
  sku text not null,
  quantity numeric(12,3) not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  discount_cents integer not null default 0,
  tax_cents integer not null default 0,
  line_total_cents integer not null default 0
);

create table if not exists public.order_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  payment_method text not null check (payment_method in ('cash', 'card', 'transfer', 'mixed')),
  amount_cents integer not null check (amount_cents >= 0),
  reference text,
  paid_at timestamptz not null default timezone('utc', now()),
  received_by uuid references public.profiles(id)
);

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_status_channel_idx on public.orders(status, sales_channel);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists order_payments_order_id_idx on public.order_payments(order_id);
create index if not exists order_events_order_id_idx on public.order_events(order_id);

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute function public.set_current_timestamp_updated_at();