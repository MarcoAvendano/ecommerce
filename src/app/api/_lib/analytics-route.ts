import { NextResponse } from "next/server";
import { getAuthContext, hasAnyRole } from "@/lib/auth";

export function parseIntegerParam(value: string | null, min: number, max: number) {
  if (value === null) {
    return null;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < min || parsedValue > max) {
    return Number.NaN;
  }

  return parsedValue;
}

export async function requireAnalyticsRequest() {
  const authContext = await getAuthContext();

  if (!authContext) {
    return {
      error: NextResponse.json({ message: "No autenticado." }, { status: 401 }),
    };
  }

  const isAllowed = authContext.isAdmin || (await hasAnyRole(["manager", "cashier"]));

  if (!isAllowed) {
    return {
      error: NextResponse.json({ message: "No autorizado." }, { status: 403 }),
    };
  }

  return { authContext };
}