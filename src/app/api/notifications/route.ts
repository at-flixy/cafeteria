import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/errors";
import { requireUser } from "@/lib/rbac";

export async function GET() {
  try {
    const user = await requireUser();
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return Response.json(notifications);
  } catch (error) {
    return errorResponse(error);
  }
}
