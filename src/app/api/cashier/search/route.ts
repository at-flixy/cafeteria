import { Role } from "@prisma/client";
import { errorResponse } from "@/lib/errors";
import { searchCashierOrders } from "@/lib/orders";
import { requireRole } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    await requireRole([Role.CASHIER]);
    const url = new URL(request.url);
    const orders = await searchCashierOrders(url.searchParams.get("q") ?? "");
    return Response.json(orders);
  } catch (error) {
    return errorResponse(error);
  }
}
