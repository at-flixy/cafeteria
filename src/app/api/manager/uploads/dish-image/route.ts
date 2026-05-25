import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { Role } from "@prisma/client";
import { AppError, errorResponse } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";

const allowedTypes = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/svg+xml", "svg"],
]);

function safeBaseName(name: string) {
  return name
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zа-я0-9]+/gi, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50) || "dish";
}

export async function POST(request: Request) {
  try {
    await requireRole([Role.MANAGER]);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new AppError("Файл изображения не передан", "IMAGE_REQUIRED", 400);
    }
    const ext = allowedTypes.get(file.type);
    if (!ext) {
      throw new AppError("Поддерживаются PNG, JPG, WEBP, GIF и SVG", "IMAGE_TYPE_UNSUPPORTED", 400);
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new AppError("Размер изображения не должен превышать 5 МБ", "IMAGE_TOO_LARGE", 413);
    }

    const dir = path.join(process.cwd(), "public", "dishes", "uploads");
    await fs.mkdir(dir, { recursive: true });
    const fileName = `${safeBaseName(file.name)}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(dir, fileName), bytes);
    return Response.json({ url: `/dishes/uploads/${fileName}` }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
