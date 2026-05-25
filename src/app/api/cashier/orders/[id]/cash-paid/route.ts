import { Role } from "@prisma/client";
import { errorResponse } from "@/lib/errors";
import { markCashPaid } from "@/lib/orders";
import { requireRole } from "@/lib/rbac";

export async function POST(_request: Request, context: { params: { id: string } }) {
  try {
    const user = await requireRole([Role.CASHIER]);
    const order = await markCashPaid(context.params.id, user.id);
    return Response.json(order);
  } catch (error) {
    return errorResponse(error);
  }
}
