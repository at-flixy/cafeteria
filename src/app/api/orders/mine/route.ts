import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/errors";
import { orderInclude } from "@/lib/orders";
import { requireRole } from "@/lib/rbac";

export async function GET() {
  try {
    const user = await requireRole([Role.CLIENT]);
    const orders = await prisma.order.findMany({
      where: { clientId: user.id },
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });
    return Response.json(orders);
  } catch (error) {
    return errorResponse(error);
  }
}
