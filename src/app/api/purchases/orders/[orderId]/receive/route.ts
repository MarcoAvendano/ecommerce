import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuppliersRequest } from "@/app/api/_lib/suppliers";
import {
  receivePurchaseOrderSchema,
  type ReceivePurchaseOrderInput,
} from "@/features/suppliers/schemas";
import type { PurchaseOrderReceiptResponse } from "@/features/suppliers/suppliers.types";

export async function POST(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  const suppliersRequest = await requireSuppliersRequest();

  if (suppliersRequest.error) {
    return suppliersRequest.error;
  }

  const { orderId } = await context.params;
  const payload = await request.json().catch(() => null);
  const parsedPayload = receivePurchaseOrderSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return NextResponse.json(
      { message: "Datos invalidos.", errors: parsedPayload.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const adminClient = createAdminClient();
  const { authContext } = suppliersRequest;
  const input: ReceivePurchaseOrderInput = parsedPayload.data;
  const { error } = await adminClient.rpc("receive_purchase_order", {
    p_purchase_order_id: orderId,
    p_location_id: input.locationId,
    p_received_by: authContext.user.id,
    p_items: input.items.map((item) => ({
      purchase_order_item_id: item.purchaseOrderItemId,
      received_qty: item.receivedQty,
    })),
    p_notes: input.notes.trim() || null,
  });

  if (error) {
    return NextResponse.json(
      { message: error.message ?? "No se pudo registrar la recepcion de compra." },
      { status: 400 },
    );
  }

  const responseBody: PurchaseOrderReceiptResponse = {
    message: "Recepcion registrada correctamente.",
    orderId,
  };

  return NextResponse.json(responseBody, { status: 201 });
}
