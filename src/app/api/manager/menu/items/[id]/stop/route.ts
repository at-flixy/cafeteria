import { Role } from "@prisma/client";
import { errorResponse } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { toggleStopList } from "@/lib/orders";
import { stopListSchema } from "@/lib/validators";

export async function POST(request: Request, context: { params: { id: string } }) {
  try {
    const user = await requireRole([Role.MANAGER]);
    const dto = stopListSchema.parse(await request.json());
    const item = await toggleStopList(context.params.id, dto.value, user.id);
    return Response.json(item);
  } catch (error) {
    return errorResponse(error);
  }
}
