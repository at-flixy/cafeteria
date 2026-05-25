import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { dishSchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireRole([Role.MANAGER]);
    const dishes = await prisma.dish.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { menuItems: true },
        },
      },
    });
    return Response.json(dishes);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole([Role.MANAGER]);
    const dto = dishSchema.parse(await request.json());
    const dish = await prisma.dish.create({ data: dto });
    return Response.json(dish, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
