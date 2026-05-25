import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { ForbiddenError } from "@/lib/errors";
import { authOptions } from "@/lib/auth";
export { roleLabel } from "@/lib/roles";

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new ForbiddenError("Требуется вход в систему");
  }
  return session.user;
}

export async function requireRole(roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new ForbiddenError();
  }
  return user;
}
