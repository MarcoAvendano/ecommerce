create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  email extensions.citext,
  phone text,
  tax_id text,
  address jsonb not null default '{}'::jsonb,
  payment_terms_days integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.supplier_contacts (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  full_name text not null,
  email extensions.citext,
  phone text,
  role text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.product_suppliers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  supplier_sku text,
  last_cost_cents integer,
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id),
  order_number text not null unique default public.generate_document_number('PO'),
  status text not null default 'draft' check (status in ('draft', 'sent', 'partial', 'received', 'cancelled')),
  ordered_at timestamptz not null default timezone('utc', now()),
  expected_at timestamptz,
  subtotal_cents integer not null default 0,
  discount_cents integer not null default 0,
  tax_cents integer not null default 0,
  total_cents integer not null default 0,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  variant_id uuid references public.product_variants(id),
  ordered_qty numeric(12,3) not null check (ordered_qty > 0),
  received_qty numeric(12,3) not null default 0 check (received_qty >= 0),
  unit_cost_cents integer not null check (unit_cost_cents >= 0),
  tax_rate numeric(5,2) not null default 0,
  line_total_cents integer not null default 0
);

create index if not exists supplier_contacts_supplier_id_idx on public.supplier_contacts(supplier_id);
create index if not exists product_suppliers_supplier_id_idx on public.product_suppliers(supplier_id);
create index if not exists purchase_orders_supplier_id_idx on public.purchase_orders(supplier_id);
create index if not exists purchase_orders_status_idx on public.purchase_orders(status);
create index if not exists purchase_order_items_purchase_order_id_idx on public.purchase_order_items(purchase_order_id);

drop trigger if exists set_suppliers_updated_at on public.suppliers;
create trigger set_suppliers_updated_at
before update on public.suppliers
for each row execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_supplier_contacts_updated_at on public.supplier_contacts;
create trigger set_supplier_contacts_updated_at
before update on public.supplier_contacts
for each row execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_purchase_orders_updated_at on public.purchase_orders;
create trigger set_purchase_orders_updated_at
before update on public.purchase_orders
for each row execute function public.set_current_timestamp_updated_at();