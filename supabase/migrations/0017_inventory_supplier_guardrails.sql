create or replace function public.validate_inventory_movement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  locked_balance record;
  locked_purchase_order record;
  zero_uuid constant uuid := '00000000-0000-0000-0000-000000000000'::uuid;
begin
  if new.quantity = 0 then
    raise exception 'Inventory movement quantity cannot be zero';
  end if;

  case new.movement_type
    when 'initial_load' then
      if new.quantity <= 0 then
        raise exception 'Initial inventory load must be positive';
      end if;

      if new.reference_type <> 'product' or new.reference_id is null then
        raise exception 'Initial inventory load must reference a product';
      end if;

      if exists (
        select 1
        from public.inventory_movements movement
        where movement.movement_type = 'initial_load'
          and movement.location_id = new.location_id
          and movement.product_id = new.product_id
          and coalesce(movement.variant_id, zero_uuid) = coalesce(new.variant_id, zero_uuid)
      ) then
        raise exception 'Initial inventory load has already been recorded for this product variant in the selected location';
      end if;
    when 'purchase_receipt' then
      if new.quantity <= 0 then
        raise exception 'Purchase receipt quantity must be positive';
      end if;

      if new.reference_type <> 'purchase_order' or new.reference_id is null then
        raise exception 'Purchase receipt must reference a purchase order';
      end if;

      select po.id, po.status
      into locked_purchase_order
      from public.purchase_orders po
      where po.id = new.reference_id
      for update;

      if locked_purchase_order.id is null then
        raise exception 'Referenced purchase order was not found';
      end if;

      if locked_purchase_order.status not in ('draft', 'sent', 'partial') then
        raise exception 'Purchase order % cannot receive inventory in status %', new.reference_id, locked_purchase_order.status;
      end if;
    when 'sale' then
      if new.quantity >= 0 then
        raise exception 'Sale movements must be negative';
      end if;

      if new.reference_type <> 'order' or new.reference_id is null then
        raise exception 'Sale movements must reference an order';
      end if;
    when 'sale_return' then
      if new.quantity <= 0 then
        raise exception 'Sale return movements must be positive';
      end if;
    when 'adjustment_in' then
      if new.quantity <= 0 then
        raise exception 'Adjustment in movements must be positive';
      end if;
    when 'adjustment_out' then
      if new.quantity >= 0 then
        raise exception 'Adjustment out movements must be negative';
      end if;
    when 'transfer_in' then
      if new.quantity <= 0 then
        raise exception 'Transfer in movements must be positive';
      end if;
    when 'transfer_out' then
      if new.quantity >= 0 then
        raise exception 'Transfer out movements must be negative';
      end if;
  end case;

  if new.quantity < 0 then
    select balance.id, balance.on_hand_qty
    into locked_balance
    from public.inventory_balances balance
    where balance.location_id = new.location_id
      and balance.product_id = new.product_id
      and coalesce(balance.variant_id, zero_uuid) = coalesce(new.variant_id, zero_uuid)
    for update;

    if locked_balance.id is null then
      raise exception 'Inventory balance was not found for the requested movement';
    end if;

    if coalesce(locked_balance.on_hand_qty, 0) + new.quantity < 0 then
      raise exception 'Inventory movement would leave negative stock';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.record_initial_inventory_load(
  p_location_id uuid,
  p_product_id uuid,
  p_variant_id uuid,
  p_quantity numeric,
  p_unit_cost_cents integer,
  p_reference_id uuid,
  p_notes text default null,
  p_moved_by uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Initial inventory load quantity must be greater than zero';
  end if;

  perform 1
  from public.inventory_locations location
  where location.id = p_location_id
    and location.is_active = true;

  if not found then
    raise exception 'Initial inventory load requires an active inventory location';
  end if;

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
    p_product_id,
    p_variant_id,
    'initial_load',
    p_quantity,
    p_unit_cost_cents,
    'product',
    p_reference_id,
    p_notes,
    p_moved_by
  );
end;
$$;

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
  requested_qty numeric;
  pending_qty numeric;
  new_status text := 'received';
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Purchase order receipt requires at least one item';
  end if;

  perform 1
  from public.inventory_locations location
  where location.id = p_location_id
    and location.is_active = true;

  if not found then
    raise exception 'Purchase receipts require an active inventory location';
  end if;

  for item_record in select * from jsonb_array_elements(p_items)
  loop
    requested_qty := (item_record ->> 'received_qty')::numeric;

    if requested_qty is null or requested_qty <= 0 then
      raise exception 'Each received quantity must be greater than zero';
    end if;

    select poi.*, po.status
    into purchase_item
    from public.purchase_order_items poi
    join public.purchase_orders po on po.id = poi.purchase_order_id
    where poi.id = (item_record ->> 'purchase_order_item_id')::uuid
      and poi.purchase_order_id = p_purchase_order_id
    for update of poi, po;

    if purchase_item.id is null then
      raise exception 'Purchase order item % not found', item_record ->> 'purchase_order_item_id';
    end if;

    if purchase_item.status in ('cancelled', 'received') then
      raise exception 'Purchase order % cannot receive inventory in status %', p_purchase_order_id, purchase_item.status;
    end if;

    pending_qty := purchase_item.ordered_qty - purchase_item.received_qty;

    if pending_qty <= 0 then
      raise exception 'Purchase order item % has already been fully received', purchase_item.id;
    end if;

    if requested_qty > pending_qty then
      raise exception 'Received quantity % exceeds pending quantity % for purchase order item %', requested_qty, pending_qty, purchase_item.id;
    end if;

    update public.purchase_order_items
    set received_qty = received_qty + requested_qty
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
      requested_qty,
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

grant execute on function public.record_initial_inventory_load(uuid, uuid, uuid, numeric, integer, uuid, text, uuid) to authenticated;
grant execute on function public.receive_purchase_order(uuid, uuid, uuid, jsonb, text) to authenticated;

drop trigger if exists inventory_movements_validate on public.inventory_movements;
create trigger inventory_movements_validate
before insert on public.inventory_movements
for each row execute function public.validate_inventory_movement();
