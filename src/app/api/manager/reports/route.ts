import { Role } from "@prisma/client";
import { errorResponse } from "@/lib/errors";
import { buildReport } from "@/lib/reports";
import { requireRole } from "@/lib/rbac";
import { reportQuerySchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    await requireRole([Role.MANAGER]);
    const url = new URL(request.url);
    const query = reportQuerySchema.parse({
      type: url.searchParams.get("type") ?? "daily",
      date: url.searchParams.get("date") ?? undefined,
    });
    const report = await buildReport(query.type, query.date ? new Date(query.date) : new Date());
    return Response.json(report);
  } catch (error) {
    return errorResponse(error);
  }
}
