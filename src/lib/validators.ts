import { PaymentMethod, Role } from "@prisma/client";
import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Введите имя"),
  email: z.string().trim().email("Некорректный email").toLowerCase(),
  password: z.string().min(4, "Минимум 4 символа"),
});

export const createOrderSchema = z.object({
  slotId: z.string().min(1),
  items: z.array(z.object({
    menuItemId: z.string().min(1),
    quantity: z.coerce.number().int().positive().max(20),
  })).min(1),
});

export const payOrderSchema = z.object({
  method: z.enum([PaymentMethod.ONLINE, PaymentMethod.CASH]),
});

export const dishSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().optional().nullable(),
  price: z.coerce.number().positive(),
  calories: z.coerce.number().int().nonnegative().default(0),
  proteins_g: z.coerce.number().nonnegative().default(0),
  fats_g: z.coerce.number().nonnegative().default(0),
  carbs_g: z.coerce.number().nonnegative().default(0),
  allergens: z.string().trim().optional().nullable(),
  photoUrl: z.string().trim().optional().nullable(),
});

export const dishUpdateSchema = dishSchema.partial();

export const menuUpsertSchema = z.object({
  menuDate: z.string().date(),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]).default("DRAFT"),
});

export const menuStatusSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]).default("PUBLISHED"),
});

export const menuItemUpdateSchema = z.object({
  price: z.coerce.number().positive().optional(),
  availableQty: z.coerce.number().int().nonnegative().optional(),
  dishId: z.string().min(1).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]).optional(),
});

export const menuItemCreateSchema = z.object({
  menuDate: z.string().date().optional(),
  dishId: z.string().min(1),
  price: z.coerce.number().positive().optional(),
  availableQty: z.coerce.number().int().nonnegative().default(10),
});

export const stopListSchema = z.object({
  value: z.boolean(),
});

export const slotSchema = z.object({
  slotDate: z.string().date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  orderLimit: z.coerce.number().int().positive(),
});

export const slotLimitSchema = z.object({
  orderLimit: z.coerce.number().int().positive(),
});

export const reportQuerySchema = z.object({
  type: z.enum(["daily", "weekly"]).default("daily"),
  date: z.string().date().optional(),
});

export const roleValues = [Role.CLIENT, Role.CASHIER, Role.MANAGER, Role.ADMIN] as const;
