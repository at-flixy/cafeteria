import { MenuStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { startOfLocalDay } from "@/lib/dates";
import { errorResponse } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { menuStatusSchema, menuUpsertSchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireRole([Role.MANAGER]);
    const menu = await prisma.dailyMenu.findUnique({
      where: { menuDate: startOfLocalDay() },
      include: { items: { include: { dish: true }, orderBy: { dish: { name: "asc" } } } },
    });
    return Response.json(menu);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole([Role.MANAGER]);
    const dto = menuUpsertSchema.parse(await request.json());
    const menuDate = startOfLocalDay(new Date(dto.menuDate));
    const menu = await prisma.dailyMenu.upsert({
      where: { menuDate },
      update: { status: dto.status, publishedAt: dto.status === MenuStatus.PUBLISHED ? new Date() : null },
      create: { menuDate, status: dto.status, publishedAt: dto.status === MenuStatus.PUBLISHED ? new Date() : null },
    });
    return Response.json(menu);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireRole([Role.MANAGER]);
    const dto = menuStatusSchema.parse(await request.json());
    const status = dto.status as MenuStatus;
    const menu = await prisma.dailyMenu.upsert({
      where: { menuDate: startOfLocalDay() },
      update: { status, publishedAt: status === MenuStatus.PUBLISHED ? new Date() : null },
      create: { menuDate: startOfLocalDay(), status, publishedAt: status === MenuStatus.PUBLISHED ? new Date() : null },
    });
    return Response.json(menu);
  } catch (error) {
    return errorResponse(error);
  }
}
