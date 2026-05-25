import { Role } from "@prisma/client";
import { createOrder } from "@/lib/orders";
import { requireRole } from "@/lib/rbac";
import { createOrderSchema } from "@/lib/validators";
import { errorResponse } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const user = await requireRole([Role.CLIENT]);
    const dto = createOrderSchema.parse(await request.json());
    const order = await createOrder(user.id, dto.slotId, dto.items);
    return Response.json(order, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
