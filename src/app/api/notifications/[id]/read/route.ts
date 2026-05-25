import { prisma } from "@/lib/db";
import { errorResponse, ForbiddenError } from "@/lib/errors";
import { requireUser } from "@/lib/rbac";

export async function POST(_request: Request, context: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const notification = await prisma.notification.findUnique({ where: { id: context.params.id } });
    if (!notification || notification.userId !== user.id) throw new ForbiddenError("Уведомление недоступно");
    const updated = await prisma.notification.update({ where: { id: context.params.id }, data: { readAt: new Date() } });
    return Response.json(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
