import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/errors";
import { registerSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const dto = registerSchema.parse(await request.json());
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        passwordHash,
        role: Role.CLIENT,
      },
      select: { id: true, fullName: true, email: true, role: true },
    });
    return Response.json(user, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
