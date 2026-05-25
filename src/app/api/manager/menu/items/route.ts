import { MenuStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { startOfLocalDay } from "@/lib/dates";
import { errorResponse } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { menuItemCreateSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    await requireRole([Role.MANAGER]);
    const dto = menuItemCreateSchema.parse(await request.json());
    const menuDate = dto.menuDate ? startOfLocalDay(new Date(dto.menuDate)) : startOfLocalDay();
    const dish = await prisma.dish.findUniqueOrThrow({ where: { id: dto.dishId } });
    const menu = await prisma.dailyMenu.upsert({
      where: { menuDate },
      update: {},
      create: { menuDate, status: MenuStatus.DRAFT },
    });
    const item = await prisma.menuItem.create({
      data: {
        menuId: menu.id,
        dishId: dto.dishId,
        price: dto.price ?? dish.price,
        availableQty: dto.availableQty,
      },
      include: { dish: true },
    });
    return Response.json(item, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
