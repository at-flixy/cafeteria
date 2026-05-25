import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ForbiddenError, errorResponse } from "@/lib/errors";
import { payOrder } from "@/lib/orders";
import { requireRole } from "@/lib/rbac";
import { payOrderSchema } from "@/lib/validators";

export async function POST(request: Request, context: { params: { id: string } }) {
  try {
    const user = await requireRole([Role.CLIENT]);
    const dto = payOrderSchema.parse(await request.json());
    const order = await prisma.order.findUnique({ where: { id: context.params.id }, select: { clientId: true } });
    if (!order || order.clientId !== user.id) throw new ForbiddenError("Можно оплатить только свой заказ");
    const updated = await payOrder(context.params.id, dto.method);
    return Response.json(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
