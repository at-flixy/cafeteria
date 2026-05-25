import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}

export class OutOfStockError extends AppError {
  constructor(message = "Недостаточно порций выбранного блюда") {
    super(message, "OUT_OF_STOCK", 409);
  }
}

export class SlotFullError extends AppError {
  constructor(message = "Слот заполнен, выберите другой") {
    super(message, "SLOT_FULL", 409);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Недостаточно прав") {
    super(message, "FORBIDDEN", 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Запись не найдена") {
    super(message, "NOT_FOUND", 404);
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return Response.json({ error: error.message, code: error.code }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return Response.json(
      { error: "Проверьте данные формы", code: "VALIDATION_ERROR", issues: error.issues },
      { status: 400 },
    );
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return Response.json({ error: "Такая запись уже существует", code: "UNIQUE_CONSTRAINT" }, { status: 409 });
    }
    if (error.code === "P2003") {
      return Response.json({ error: "Запись связана с другими данными", code: "RELATION_CONSTRAINT" }, { status: 409 });
    }
    if (error.code === "P2025") {
      return Response.json({ error: "Запись не найдена", code: "NOT_FOUND" }, { status: 404 });
    }
  }
  return Response.json({ error: "Внутренняя ошибка сервера", code: "INTERNAL_ERROR" }, { status: 500 });
}
