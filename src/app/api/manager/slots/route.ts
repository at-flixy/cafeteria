import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { startOfLocalDay } from "@/lib/dates";
import { errorResponse } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { slotSchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    await requireRole([Role.MANAGER]);
    const date = new URL(request.url).searchParams.get("date");
    const slotDate = date ? startOfLocalDay(new Date(date)) : startOfLocalDay();
    const slots = await prisma.timeSlot.findMany({
      where: { slotDate },
      orderBy: { startTime: "asc" },
    });
    return Response.json(slots);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole([Role.MANAGER]);
    const dto = slotSchema.parse(await request.json());
    const slot = await prisma.timeSlot.create({ data: { ...dto, slotDate: startOfLocalDay(new Date(dto.slotDate)) } });
    return Response.json(slot, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
