import { cancelOrder } from "@/lib/orders";
import { requireUser } from "@/lib/rbac";
import { errorResponse } from "@/lib/errors";

export async function POST(_request: Request, context: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const order = await cancelOrder(context.params.id, user.id);
    return Response.json(order);
  } catch (error) {
    return errorResponse(error);
  }
}
