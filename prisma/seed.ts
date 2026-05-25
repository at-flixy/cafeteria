import bcrypt from "bcrypt";
import { PrismaClient, Role } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();

const todayStart = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const colors = ["#f59e0b", "#ea580c", "#d97706", "#84cc16", "#dc2626", "#0f766e", "#b45309", "#f97316"];

function colorFor(name: string) {
  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-zа-я0-9]+/gi, "-").replace(/(^-|-$)/g, "");
}

async function writeDishSvg(name: string) {
  const fileName = `${slugify(name)}.svg`;
  const bg = colorFor(name);
  const letter = name.slice(0, 1).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420" role="img" aria-label="${name}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg}"/>
      <stop offset="1" stop-color="#fff7ed"/>
    </linearGradient>
  </defs>
  <rect width="640" height="420" rx="32" fill="url(#g)"/>
  <circle cx="500" cy="90" r="96" fill="#ffffff" opacity=".24"/>
  <circle cx="128" cy="330" r="118" fill="#451a03" opacity=".10"/>
  <text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="150" font-weight="700" fill="#fff">${letter}</text>
  <text x="50%" y="78%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#451a03">${name}</text>
</svg>`;
  await fs.mkdir(path.join(process.cwd(), "public", "dishes"), { recursive: true });
  await fs.writeFile(path.join(process.cwd(), "public", "dishes", fileName), svg, "utf8");
  return `/dishes/${fileName}`;
}

const dishData = [
  ["Лагман", "Густая лапша с говядиной и овощами", 165, 520, 24, 18, 64, "глютен"],
  ["Манты", "Паровые манты с рубленой говядиной", 140, 610, 28, 24, 70, "глютен"],
  ["Плов с говядиной", "Рис, морковь, нут и нежная говядина", 175, 690, 31, 26, 78, ""],
  ["Бешбармак", "Домашняя лапша с мясом и луком", 190, 720, 34, 29, 82, "глютен"],
  ["Самса", "Слоеная самса с мясом", 75, 360, 14, 20, 34, "глютен"],
  ["Куурдак", "Жаркое из говядины с картофелем", 185, 650, 32, 31, 52, ""],
  ["Борщ", "Свекольный суп со сметаной", 95, 240, 9, 11, 26, "молоко"],
  ["Окрошка", "Холодный суп на кефире", 90, 210, 10, 9, 22, "молоко"],
  ["Греческий салат", "Овощи, брынза, оливки и зелень", 120, 310, 9, 22, 18, "молоко"],
  ["Цезарь с курицей", "Курица, салат, сухари и соус", 150, 430, 27, 25, 24, "глютен, яйца"],
  ["Картофельное пюре", "Нежное пюре на молоке", 65, 220, 5, 8, 34, "молоко"],
  ["Котлета по-киевски", "Куриная котлета с маслом и зеленью", 155, 520, 30, 34, 22, "глютен, молоко"],
  ["Гречка с грибами", "Рассыпчатая гречка с шампиньонами", 85, 300, 10, 9, 48, ""],
  ["Рыба запечённая", "Филе рыбы с лимоном и зеленью", 170, 410, 36, 22, 10, "рыба"],
  ["Компот из сухофруктов", "Домашний напиток без газа", 35, 110, 0, 0, 27, ""],
  ["Морс клюквенный", "Кисло-сладкий ягодный морс", 45, 120, 0, 0, 29, ""],
  ["Пирожок с капустой", "Печёный пирожок с капустой", 45, 260, 7, 10, 36, "глютен"],
  ["Чизкейк", "Порционный сливочный десерт", 110, 420, 8, 27, 37, "молоко, яйца"],
  ["Эчпочмак", "Треугольник с мясом и картофелем", 80, 390, 15, 21, 38, "глютен"],
  ["Чай", "Чёрный чай", 20, 5, 0, 0, 1, ""],
] as const;

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.dailyMenu.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.user.deleteMany();
  await prisma.reportSnapshot.deleteMany();

  const passwordHash = await bcrypt.hash("demo", 10);
  const users = await Promise.all([
    prisma.user.create({ data: { fullName: "Алина Студентова", email: "client@demo", passwordHash, role: Role.CLIENT } }),
    prisma.user.create({ data: { fullName: "Иван Кассиров", email: "cashier@demo", passwordHash, role: Role.CASHIER } }),
    prisma.user.create({ data: { fullName: "Мария Менеджерова", email: "manager@demo", passwordHash, role: Role.MANAGER } }),
  ]);

  const dishes = [];
  for (const [name, description, price, calories, proteins_g, fats_g, carbs_g, allergens] of dishData) {
    const photoUrl = await writeDishSvg(name);
    dishes.push(await prisma.dish.create({
      data: { name, description, price, calories, proteins_g, fats_g, carbs_g, allergens, photoUrl },
    }));
  }

  const menuDate = todayStart();
  const menu = await prisma.dailyMenu.create({
    data: { menuDate, status: "PUBLISHED", publishedAt: new Date() },
  });

  for (let index = 0; index < dishes.length; index += 1) {
    await prisma.menuItem.create({
      data: {
        menuId: menu.id,
        dishId: dishes[index].id,
        price: dishes[index].price,
        availableQty: 10 + ((index * 7) % 31),
      },
    });
  }

  const slots = [];
  for (const [startTime, endTime] of [["12:00", "12:30"], ["12:30", "13:00"], ["13:00", "13:30"], ["13:30", "14:00"], ["14:00", "14:30"]]) {
    slots.push(await prisma.timeSlot.create({ data: { slotDate: menuDate, startTime, endTime, orderLimit: 10 } }));
  }

  const firstItems = await prisma.menuItem.findMany({ take: 2, include: { dish: true } });
  const sampleTotal = firstItems.reduce((sum, item) => sum + item.price, 0);
  const sampleOrder = await prisma.order.create({
    data: {
      orderNumber: `CP-${menuDate.toISOString().slice(0, 10).replace(/-/g, "")}-000001`,
      clientId: users[0].id,
      slotId: slots[1].id,
      status: "PAID",
      totalAmount: Number(sampleTotal.toFixed(2)),
      items: {
        create: firstItems.map((item) => ({
          menuItemId: item.id,
          quantity: 1,
          unitPrice: item.price,
        })),
      },
      payment: {
        create: { method: "ONLINE", status: "SUCCESS", providerRef: "mock-seed", paidAt: new Date() },
      },
    },
  });

  for (const item of firstItems) {
    await prisma.menuItem.update({ where: { id: item.id }, data: { reservedQty: { increment: 1 } } });
  }
  await prisma.timeSlot.update({ where: { id: slots[1].id }, data: { reservedCount: { increment: 1 } } });
  await prisma.notification.create({
    data: { userId: users[0].id, type: "ORDER", message: `Заказ #${sampleOrder.orderNumber} оплачен и ожидает выдачи` },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    await prisma.$disconnect();
    process.exit(1);
  });
