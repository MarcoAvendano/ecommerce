create or replace function public.confirm_pos_sale(
  p_location_id uuid,
  p_created_by uuid,
  p_items jsonb,
  p_payment_method text,
  p_customer_id uuid default null,
  p_notes text default null,
  p_order_discount_cents integer default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_order_id uuid := gen_random_uuid();
  item_record jsonb;
  product_record record;
  balance_record record;
  current_subtotal integer := 0;
  current_discount integer := coalesce(p_order_discount_cents, 0);
  current_tax integer := 0;
  current_total integer := 0;
  line_total integer;
  line_discount integer;
  line_tax integer;
  line_quantity numeric(12,3);
  line_unit_price integer;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'POS sale requires at least one item';
  end if;

  if p_payment_method not in ('cash', 'card', 'transfer', 'mixed') then
    raise exception 'Unsupported payment method %', p_payment_method;
  end if;

  insert into public.orders (
    id,
    order_number,
    sales_channel,
    customer_id,
    user_id,
    status,
    notes,
    created_by
  )
  values (
    new_order_id,
    public.generate_document_number('POS'),
    'pos',
    p_customer_id,
    p_created_by,
    'paid',
    p_notes,
    p_created_by
  );

  for item_record in select * from jsonb_array_elements(p_items)
  loop
    line_quantity := (item_record ->> 'quantity')::numeric;
    line_discount := coalesce((item_record ->> 'discount_cents')::integer, 0);
    line_tax := coalesce((item_record ->> 'tax_cents')::integer, 0);

    if line_quantity is null or line_quantity <= 0 then
      raise exception 'Quantity must be greater than zero';
    end if;

    select
      pv.id as variant_id,
      pv.product_id,
      pv.sku,
      pv.name as variant_name,
      p.name as product_name,
      p.status as product_status,
      p.is_sellable,
      p.track_inventory,
      pv.is_active,
      coalesce((item_record ->> 'unit_price_cents')::integer, pv.price_cents) as unit_price_cents
    into product_record
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    where pv.id = (item_record ->> 'variant_id')::uuid;

    if product_record.variant_id is null then
      raise exception 'Variant % not found', item_record ->> 'variant_id';
    end if;

    if product_record.product_status <> 'active' or product_record.is_sellable is not true then
      raise exception 'Variant % is not sellable', item_record ->> 'variant_id';
    end if;

    if product_record.is_active is not true then
      raise exception 'Variant % is inactive', item_record ->> 'variant_id';
    end if;

    if product_record.track_inventory then
      select id, available_qty
      into balance_record
      from public.inventory_balances
      where location_id = p_location_id
        and product_id = product_record.product_id
        and coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid) = product_record.variant_id
      for update;

      if balance_record.id is null or coalesce(balance_record.available_qty, 0) < line_quantity then
        raise exception 'Insufficient inventory for variant % at location %', item_record ->> 'variant_id', p_location_id;
      end if;
    end if;

    line_unit_price := product_record.unit_price_cents;
    line_total := ((line_unit_price * line_quantity)::integer - line_discount) + line_tax;
    current_subtotal := current_subtotal + (line_unit_price * line_quantity)::integer;
    current_tax := current_tax + line_tax;

    insert into public.order_items (
      order_id,
      product_id,
      variant_id,
      item_name,
      sku,
      quantity,
      unit_price_cents,
      discount_cents,
      tax_cents,
      line_total_cents
    )
    values (
      new_order_id,
      product_record.product_id,
      product_record.variant_id,
      coalesce(product_record.variant_name, product_record.product_name),
      product_record.sku,
      line_quantity,
      line_unit_price,
      line_discount,
      line_tax,
      line_total
    );

    insert into public.inventory_movements (
      location_id,
      product_id,
      variant_id,
      movement_type,
      quantity,
      unit_cost_cents,
      reference_type,
      reference_id,
      notes,
      moved_by
    )
    values (
      p_location_id,
      product_record.product_id,
      product_record.variant_id,
      'sale',
      line_quantity * -1,
      null,
      'order',
      new_order_id,
      p_notes,
      p_created_by
    );
  end loop;

  current_total := current_subtotal - current_discount + current_tax;

  update public.orders
  set subtotal_cents = current_subtotal,
      discount_cents = current_discount,
      tax_cents = current_tax,
      total_cents = current_total,
      updated_at = timezone('utc', now())
  where id = new_order_id;

  insert into public.order_payments (
    order_id,
    payment_method,
    amount_cents,
    received_by
  )
  values (
    new_order_id,
    p_payment_method,
    current_total,
    p_created_by
  );

  insert into public.order_events (
    order_id,
    event_type,
    payload,
    created_by
  )
  values (
    new_order_id,
    'pos_sale_confirmed',
    jsonb_build_object(
      'location_id', p_location_id,
      'payment_method', p_payment_method,
      'items_count', jsonb_array_length(p_items)
    ),
    p_created_by
  );

  return new_order_id;
end;
$$;

grant execute on function public.confirm_pos_sale(uuid, uuid, jsonb, text, uuid, text, integer) to authenticated;
