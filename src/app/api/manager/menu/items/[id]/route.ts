import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AppError, errorResponse } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { menuItemUpdateSchema } from "@/lib/validators";

export async function PUT(request: Request, context: { params: { id: string } }) {
  try {
    await requireRole([Role.MANAGER]);
    const dto = menuItemUpdateSchema.parse(await request.json());
    const item = await prisma.$transaction(async (tx) => {
      const current = await tx.menuItem.findUniqueOrThrow({
        where: { id: context.params.id },
        select: {
          dishId: true,
          reservedQty: true,
          _count: { select: { orderItems: true } },
        },
      });
      if (dto.availableQty !== undefined && dto.availableQty < current.reservedQty) {
        throw new AppError("Доступное количество не может быть меньше уже зарезервированных порций", "MENU_ITEM_QTY_LOCKED", 409);
      }
      if (dto.dishId && dto.dishId !== current.dishId && (current.reservedQty > 0 || current._count.orderItems > 0)) {
        throw new AppError("Нельзя заменить блюдо у позиции, которая уже есть в заказах или резерве", "MENU_ITEM_DISH_LOCKED", 409);
      }
      return tx.menuItem.update({
        where: { id: context.params.id },
        data: {
          dishId: dto.dishId,
          price: dto.price,
          availableQty: dto.availableQty,
        },
        include: { dish: true },
      });
    });
    return Response.json(item);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: { params: { id: string } }) {
  try {
    await requireRole([Role.MANAGER]);
    const item = await prisma.menuItem.findUniqueOrThrow({
      where: { id: context.params.id },
      select: { reservedQty: true, _count: { select: { orderItems: true } } },
    });
    if (item.reservedQty > 0 || item._count.orderItems > 0) {
      throw new AppError("Нельзя удалить позицию меню: она уже есть в заказах или резерве", "MENU_ITEM_LOCKED", 409);
    }
    await prisma.menuItem.delete({ where: { id: context.params.id } });
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
