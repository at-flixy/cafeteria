import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AppError, errorResponse } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { dishUpdateSchema } from "@/lib/validators";

export async function GET(_request: Request, context: { params: { id: string } }) {
  try {
    await requireRole([Role.MANAGER]);
    const dish = await prisma.dish.findUnique({
      where: { id: context.params.id },
      include: {
        menuItems: {
          include: { menu: true },
          orderBy: { menu: { menuDate: "desc" } },
        },
      },
    });
    if (!dish) return Response.json({ error: "Блюдо не найдено" }, { status: 404 });
    return Response.json(dish);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request, context: { params: { id: string } }) {
  try {
    await requireRole([Role.MANAGER]);
    const dto = dishUpdateSchema.parse(await request.json());
    const dish = await prisma.dish.update({ where: { id: context.params.id }, data: dto });
    return Response.json(dish);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: { params: { id: string } }) {
  try {
    await requireRole([Role.MANAGER]);
    await prisma.$transaction(async (tx) => {
      const menuItems = await tx.menuItem.findMany({
        where: { dishId: context.params.id },
        select: {
          id: true,
          reservedQty: true,
          _count: { select: { orderItems: true } },
        },
      });
      const isLocked = menuItems.some((item) => item.reservedQty > 0 || item._count.orderItems > 0);
      if (isLocked) {
        throw new AppError("Нельзя удалить блюдо: оно уже есть в заказах или резерве", "DISH_LOCKED", 409);
      }
      await tx.menuItem.deleteMany({ where: { dishId: context.params.id } });
      await tx.dish.delete({ where: { id: context.params.id } });
    });
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
