create table if not exists public.product_variant_option_groups (
  id uuid primary key default gen_random_uuid(),
  product_variant_id uuid not null references public.product_variants(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.product_variant_option_group_values (
  id uuid primary key default gen_random_uuid(),
  option_group_id uuid not null references public.product_variant_option_groups(id) on delete cascade,
  value text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.product_variant_option_group_links (
  id uuid primary key default gen_random_uuid(),
  product_variant_id uuid not null references public.product_variants(id) on delete cascade,
  option_group_id uuid not null references public.product_variant_option_groups(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (product_variant_id, option_group_id)
);

create index if not exists product_variant_option_groups_variant_id_idx
  on public.product_variant_option_groups(product_variant_id);

create index if not exists product_variant_option_group_values_group_id_idx
  on public.product_variant_option_group_values(option_group_id);

create index if not exists product_variant_option_group_links_variant_id_idx
  on public.product_variant_option_group_links(product_variant_id);

create index if not exists product_variant_option_group_links_group_id_idx
  on public.product_variant_option_group_links(option_group_id);

drop trigger if exists set_product_variant_option_groups_updated_at on public.product_variant_option_groups;
create trigger set_product_variant_option_groups_updated_at
before update on public.product_variant_option_groups
for each row execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_product_variant_option_group_values_updated_at on public.product_variant_option_group_values;
create trigger set_product_variant_option_group_values_updated_at
before update on public.product_variant_option_group_values
for each row execute function public.set_current_timestamp_updated_at();
