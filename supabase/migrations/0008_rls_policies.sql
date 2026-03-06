create or replace function public.has_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.code = required_role
  );
$$;

create or replace function public.has_any_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.code = any(required_roles)
  );
$$;

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.customers enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_categories enable row level security;
alter table public.product_images enable row level security;
alter table public.suppliers enable row level security;
alter table public.supplier_contacts enable row level security;
alter table public.product_suppliers enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.inventory_locations enable row level security;
alter table public.inventory_balances enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.inventory_adjustments enable row level security;
alter table public.inventory_adjustment_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_payments enable row level security;
alter table public.order_events enable row level security;

drop policy if exists profiles_select_self_or_admin on public.profiles;

create policy profiles_select_self_or_admin on public.profiles
for select
using (auth.uid() = id or public.has_role('admin'));

drop policy if exists profiles_update_self_or_admin on public.profiles;

create policy profiles_update_self_or_admin on public.profiles
for update
using (auth.uid() = id or public.has_role('admin'));

drop policy if exists roles_admin_only on public.roles;

create policy roles_admin_only on public.roles
for all
using (public.has_role('admin'))
with check (public.has_role('admin'));

drop policy if exists user_roles_admin_only on public.user_roles;

create policy user_roles_admin_only on public.user_roles
for all
using (public.has_role('admin'))
with check (public.has_role('admin'));

drop policy if exists catalog_public_read on public.categories;

create policy catalog_public_read on public.categories
for select
using (is_active);

drop policy if exists brands_public_read on public.brands;

create policy brands_public_read on public.brands
for select
using (is_active);

drop policy if exists products_public_read on public.products;

create policy products_public_read on public.products
for select
using (status = 'active' and is_sellable = true and deleted_at is null);

drop policy if exists product_variants_public_read on public.product_variants;

create policy product_variants_public_read on public.product_variants
for select
using (is_active);

drop policy if exists product_categories_public_read on public.product_categories;

create policy product_categories_public_read on public.product_categories
for select
using (true);

drop policy if exists product_images_public_read on public.product_images;

create policy product_images_public_read on public.product_images
for select
using (true);

drop policy if exists catalog_staff_manage_categories on public.categories;

create policy catalog_staff_manage_categories on public.categories
for all
using (public.has_any_role(array['admin', 'manager']))
with check (public.has_any_role(array['admin', 'manager']));

drop policy if exists catalog_staff_manage_brands on public.brands;

create policy catalog_staff_manage_brands on public.brands
for all
using (public.has_any_role(array['admin', 'manager']))
with check (public.has_any_role(array['admin', 'manager']));

drop policy if exists catalog_staff_manage_products on public.products;

create policy catalog_staff_manage_products on public.products
for all
using (public.has_any_role(array['admin', 'manager']))
with check (public.has_any_role(array['admin', 'manager']));

drop policy if exists catalog_staff_manage_variants on public.product_variants;

create policy catalog_staff_manage_variants on public.product_variants
for all
using (public.has_any_role(array['admin', 'manager']))
with check (public.has_any_role(array['admin', 'manager']));

drop policy if exists customers_staff_manage on public.customers;

create policy customers_staff_manage on public.customers
for all
using (public.has_any_role(array['admin', 'manager', 'cashier']))
with check (public.has_any_role(array['admin', 'manager', 'cashier']));

drop policy if exists customer_addresses_staff_manage on public.customer_addresses;

create policy customer_addresses_staff_manage on public.customer_addresses
for all
using (public.has_any_role(array['admin', 'manager', 'cashier']))
with check (public.has_any_role(array['admin', 'manager', 'cashier']));

drop policy if exists suppliers_staff_manage on public.suppliers;

create policy suppliers_staff_manage on public.suppliers
for all
using (public.has_any_role(array['admin', 'manager', 'inventory']))
with check (public.has_any_role(array['admin', 'manager', 'inventory']));

drop policy if exists supplier_contacts_staff_manage on public.supplier_contacts;

create policy supplier_contacts_staff_manage on public.supplier_contacts
for all
using (public.has_any_role(array['admin', 'manager', 'inventory']))
with check (public.has_any_role(array['admin', 'manager', 'inventory']));

drop policy if exists product_suppliers_staff_manage on public.product_suppliers;

create policy product_suppliers_staff_manage on public.product_suppliers
for all
using (public.has_any_role(array['admin', 'manager', 'inventory']))
with check (public.has_any_role(array['admin', 'manager', 'inventory']));

drop policy if exists purchase_orders_staff_manage on public.purchase_orders;

create policy purchase_orders_staff_manage on public.purchase_orders
for all
using (public.has_any_role(array['admin', 'manager', 'inventory']))
with check (public.has_any_role(array['admin', 'manager', 'inventory']));

drop policy if exists purchase_order_items_staff_manage on public.purchase_order_items;

create policy purchase_order_items_staff_manage on public.purchase_order_items
for all
using (public.has_any_role(array['admin', 'manager', 'inventory']))
with check (public.has_any_role(array['admin', 'manager', 'inventory']));

drop policy if exists inventory_locations_staff_read on public.inventory_locations;

create policy inventory_locations_staff_read on public.inventory_locations
for select
using (public.has_any_role(array['admin', 'manager', 'inventory', 'cashier']));

drop policy if exists inventory_locations_staff_manage on public.inventory_locations;

create policy inventory_locations_staff_manage on public.inventory_locations
for all
using (public.has_any_role(array['admin', 'manager', 'inventory']))
with check (public.has_any_role(array['admin', 'manager', 'inventory']));

drop policy if exists inventory_balances_staff_read on public.inventory_balances;

create policy inventory_balances_staff_read on public.inventory_balances
for select
using (public.has_any_role(array['admin', 'manager', 'inventory', 'cashier']));

drop policy if exists inventory_movements_staff_manage on public.inventory_movements;

create policy inventory_movements_staff_manage on public.inventory_movements
for all
using (public.has_any_role(array['admin', 'manager', 'inventory', 'cashier']))
with check (public.has_any_role(array['admin', 'manager', 'inventory', 'cashier']));

drop policy if exists inventory_adjustments_staff_manage on public.inventory_adjustments;

create policy inventory_adjustments_staff_manage on public.inventory_adjustments
for all
using (public.has_any_role(array['admin', 'manager', 'inventory']))
with check (public.has_any_role(array['admin', 'manager', 'inventory']));

drop policy if exists inventory_adjustment_items_staff_manage on public.inventory_adjustment_items;

create policy inventory_adjustment_items_staff_manage on public.inventory_adjustment_items
for all
using (public.has_any_role(array['admin', 'manager', 'inventory']))
with check (public.has_any_role(array['admin', 'manager', 'inventory']));

drop policy if exists orders_staff_manage on public.orders;

create policy orders_staff_manage on public.orders
for all
using (public.has_any_role(array['admin', 'manager', 'cashier']))
with check (public.has_any_role(array['admin', 'manager', 'cashier']));

drop policy if exists order_items_staff_manage on public.order_items;

create policy order_items_staff_manage on public.order_items
for all
using (public.has_any_role(array['admin', 'manager', 'cashier']))
with check (public.has_any_role(array['admin', 'manager', 'cashier']));

drop policy if exists order_payments_staff_manage on public.order_payments;

create policy order_payments_staff_manage on public.order_payments
for all
using (public.has_any_role(array['admin', 'manager', 'cashier']))
with check (public.has_any_role(array['admin', 'manager', 'cashier']));

drop policy if exists order_events_staff_manage on public.order_events;

create policy order_events_staff_manage on public.order_events
for all
using (public.has_any_role(array['admin', 'manager', 'cashier']))
with check (public.has_any_role(array['admin', 'manager', 'cashier']));