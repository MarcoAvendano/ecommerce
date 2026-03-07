-- Nota: el usuario administrador inicial no se crea aqui.
-- Usa `npm run bootstrap:admin` para sembrar el primer admin en Supabase Auth.

insert into public.inventory_locations (code, name, location_type)
values ('MAIN', 'Main Store', 'store')
on conflict (code) do nothing;

insert into public.categories (slug, name, description)
values
  ('bebidas', 'Bebidas', 'Categoria principal para bebidas'),
  ('snacks', 'Snacks', 'Categoria principal para snacks'),
  ('accesorios', 'Accesorios', 'Accesorios de tienda y complementos')
on conflict (slug) do nothing;