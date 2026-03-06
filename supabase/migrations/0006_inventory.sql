create table if not exists public.inventory_locations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  location_type text not null default 'store' check (location_type in ('warehouse', 'store', 'virtual')),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.inventory_balances (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.inventory_locations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  on_hand_qty numeric(12,3) not null default 0,
  reserved_qty numeric(12,3) not null default 0,
  available_qty numeric(12,3) generated always as (on_hand_qty - reserved_qty) stored,
  avg_cost_cents integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists inventory_balances_unique_idx
  on public.inventory_balances (
    location_id,
    product_id,
    coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.inventory_locations(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid references public.product_variants(id) on delete restrict,
  movement_type text not null check (movement_type in ('initial_load', 'purchase_receipt', 'sale', 'sale_return', 'adjustment_in', 'adjustment_out', 'transfer_in', 'transfer_out')),
  quantity numeric(12,3) not null check (quantity <> 0),
  unit_cost_cents integer,
  reference_type text not null,
  reference_id uuid,
  notes text,
  moved_by uuid references public.profiles(id),
  moved_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.inventory_adjustments (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.inventory_locations(id) on delete restrict,
  reason text not null,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.inventory_adjustment_items (
  id uuid primary key default gen_random_uuid(),
  adjustment_id uuid not null references public.inventory_adjustments(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid references public.product_variants(id) on delete restrict,
  expected_qty numeric(12,3) not null,
  counted_qty numeric(12,3) not null,
  delta_qty numeric(12,3) not null
);

create or replace function public.apply_inventory_movement()
returns trigger
language plpgsql
as $$
declare
  balance_id uuid;
begin
  select id
  into balance_id
  from public.inventory_balances
  where location_id = new.location_id
    and product_id = new.product_id
    and coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(new.variant_id, '00000000-0000-0000-0000-000000000000'::uuid)
  limit 1;

  if balance_id is null then
    insert into public.inventory_balances (
      location_id,
      product_id,
      variant_id,
      on_hand_qty,
      avg_cost_cents
    )
    values (
      new.location_id,
      new.product_id,
      new.variant_id,
      0,
      coalesce(new.unit_cost_cents, 0)
    )
    returning id into balance_id;
  end if;

  update public.inventory_balances
  set on_hand_qty = on_hand_qty + new.quantity,
      avg_cost_cents = coalesce(new.unit_cost_cents, avg_cost_cents),
      updated_at = timezone('utc', now())
  where id = balance_id;

  return new;
end;
$$;

create index if not exists inventory_movements_reference_idx on public.inventory_movements(reference_type, reference_id);
create index if not exists inventory_movements_location_idx on public.inventory_movements(location_id, product_id, variant_id);
create index if not exists inventory_adjustment_items_adjustment_id_idx on public.inventory_adjustment_items(adjustment_id);

drop trigger if exists set_inventory_locations_updated_at on public.inventory_locations;
create trigger set_inventory_locations_updated_at
before update on public.inventory_locations
for each row execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_inventory_balances_updated_at on public.inventory_balances;
create trigger set_inventory_balances_updated_at
before update on public.inventory_balances
for each row execute function public.set_current_timestamp_updated_at();

drop trigger if exists inventory_movements_apply_balance on public.inventory_movements;
create trigger inventory_movements_apply_balance
after insert on public.inventory_movements
for each row execute function public.apply_inventory_movement();