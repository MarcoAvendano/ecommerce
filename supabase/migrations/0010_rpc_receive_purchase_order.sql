create or replace function public.receive_purchase_order(
  p_purchase_order_id uuid,
  p_location_id uuid,
  p_received_by uuid,
  p_items jsonb,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item_record jsonb;
  purchase_item record;
  new_status text := 'received';
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Purchase order receipt requires at least one item';
  end if;

  for item_record in select * from jsonb_array_elements(p_items)
  loop
    select poi.*, po.status
    into purchase_item
    from public.purchase_order_items poi
    join public.purchase_orders po on po.id = poi.purchase_order_id
    where poi.id = (item_record ->> 'purchase_order_item_id')::uuid
      and poi.purchase_order_id = p_purchase_order_id;

    if purchase_item.id is null then
      raise exception 'Purchase order item % not found', item_record ->> 'purchase_order_item_id';
    end if;

    update public.purchase_order_items
    set received_qty = received_qty + (item_record ->> 'received_qty')::numeric
    where id = purchase_item.id;

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
      purchase_item.product_id,
      purchase_item.variant_id,
      'purchase_receipt',
      (item_record ->> 'received_qty')::numeric,
      purchase_item.unit_cost_cents,
      'purchase_order',
      p_purchase_order_id,
      p_notes,
      p_received_by
    );
  end loop;

  if exists (
    select 1
    from public.purchase_order_items
    where purchase_order_id = p_purchase_order_id
      and received_qty < ordered_qty
  ) then
    new_status := 'partial';
  end if;

  update public.purchase_orders
  set status = new_status,
      updated_at = timezone('utc', now())
  where id = p_purchase_order_id;
end;
$$;

grant execute on function public.receive_purchase_order(uuid, uuid, uuid, jsonb, text) to authenticated;