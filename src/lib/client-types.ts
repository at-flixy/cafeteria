import type { OrderStatus, PaymentMethod, PaymentStatus, Role } from "@prisma/client";

export type DishDto = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  calories: number;
  proteins_g: number;
  fats_g: number;
  carbs_g: number;
  allergens: string | null;
  photoUrl: string | null;
  _count?: {
    menuItems: number;
  };
};

export type MenuItemDto = {
  id: string;
  price: number;
  availableQty: number;
  reservedQty: number;
  stopListFlag: boolean;
  dish: DishDto;
};

export type TimeSlotDto = {
  id: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  orderLimit: number;
  reservedCount: number;
};

export type TodayMenuDto = {
  menu: {
    id: string;
    menuDate: string;
    status: string;
    items: MenuItemDto[];
  } | null;
  slots: TimeSlotDto[];
};

export type CartItem = {
  menuItemId: string;
  dishId: string;
  name: string;
  price: number;
  photoUrl: string | null;
  availableQty: number;
  reservedQty: number;
  quantity: number;
};

export type OrderDto = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  issuedAt: string | null;
  client: { id: string; fullName: string; email: string; role: Role };
  cashier: { id: string; fullName: string; email: string; role: Role } | null;
  slot: TimeSlotDto;
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    menuItem: MenuItemDto;
  }[];
  payment: {
    id: string;
    method: PaymentMethod;
    status: PaymentStatus;
    paidAt: string | null;
  } | null;
};

export type NotificationDto = {
  id: string;
  message: string;
  type: string;
  readAt: string | null;
  createdAt: string;
};

export type ReportDto = {
  topDishes: { name: string; quantity: number; revenue: number }[];
  revenueByDay: { date: string; revenue: number }[];
  slotLoad: { slot: string; reserved: number; limit: number }[];
  totals: { orders: number; revenue: number; issued: number };
};
