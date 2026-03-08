drop table if exists public.product_variant_option_group_links;
drop table if exists public.product_variant_option_group_values;
drop table if exists public.product_variant_option_groups;

create table if not exists public.product_variant_option_values (
  id uuid primary key default gen_random_uuid(),
  product_variant_id uuid not null references public.product_variants(id) on delete cascade,
  option_group_id uuid not null references public.product_option_groups(id) on delete cascade,
  option_group_value_id uuid not null references public.product_option_group_values(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (product_variant_id, option_group_id)
);

create index if not exists product_variant_option_values_variant_id_idx
  on public.product_variant_option_values(product_variant_id);

create index if not exists product_variant_option_values_group_id_idx
  on public.product_variant_option_values(option_group_id);

create index if not exists product_variant_option_values_group_value_id_idx
  on public.product_variant_option_values(option_group_value_id);

drop trigger if exists set_product_variant_option_values_updated_at on public.product_variant_option_values;
create trigger set_product_variant_option_values_updated_at
before update on public.product_variant_option_values
for each row execute function public.set_current_timestamp_updated_at();
