import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { startOfLocalDay } from "@/lib/dates";
import { AppError, errorResponse } from "@/lib/errors";
import { setSlotLimit } from "@/lib/orders";
import { requireRole } from "@/lib/rbac";
import { slotLimitSchema, slotSchema } from "@/lib/validators";

export async function PUT(request: Request, context: { params: { id: string } }) {
  try {
    const user = await requireRole([Role.MANAGER]);
    const body = await request.json();
    if ("orderLimit" in body && Object.keys(body).length === 1) {
      const dto = slotLimitSchema.parse(body);
      return Response.json(await setSlotLimit(context.params.id, dto.orderLimit, user.id));
    }
    const dto = slotSchema.partial().parse(body);
    const slot = await prisma.timeSlot.update({
      where: { id: context.params.id },
      data: { ...dto, slotDate: dto.slotDate ? startOfLocalDay(new Date(dto.slotDate)) : undefined },
    });
    return Response.json(slot);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: { params: { id: string } }) {
  try {
    await requireRole([Role.MANAGER]);
    const slot = await prisma.timeSlot.findUniqueOrThrow({
      where: { id: context.params.id },
      select: { reservedCount: true, _count: { select: { orders: true } } },
    });
    if (slot.reservedCount > 0 || slot._count.orders > 0) {
      throw new AppError("Нельзя удалить слот: в нём уже есть заказы или резерв", "SLOT_LOCKED", 409);
    }
    await prisma.timeSlot.delete({ where: { id: context.params.id } });
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
