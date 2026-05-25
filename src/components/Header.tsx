"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { BarChart3, ChefHat, Clock, LogOut, ShoppingCart, Soup, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/NotificationBell";
import { roleLabel } from "@/lib/roles";

export function Header() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold text-foreground no-underline">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <UtensilsCrossed />
          </span>
          <span className="hidden sm:inline">Cafeteria Pre-order</span>
        </Link>

        {session?.user ? (
          <div className="flex items-center gap-2">
            <nav className="hidden items-center gap-1 md:flex">
              <Link href="/" className="rounded-md px-3 py-2 text-sm no-underline hover:bg-secondary">Меню</Link>
              <Link href="/orders" className="rounded-md px-3 py-2 text-sm no-underline hover:bg-secondary">Мои заказы</Link>
              {role === "CASHIER" && <Link href="/cashier" className="rounded-md px-3 py-2 text-sm no-underline hover:bg-secondary">Кассир</Link>}
              {(role === "MANAGER" || role === "ADMIN") && <Link href="/manager" className="rounded-md px-3 py-2 text-sm no-underline hover:bg-secondary">Менеджер</Link>}
            </nav>
            <Link href="/cart">
              <Button size="icon" variant="ghost" aria-label="Корзина">
                <ShoppingCart data-icon="inline-start" />
              </Button>
            </Link>
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" />}>
                <ChefHat data-icon="inline-start" />
                <span className="hidden max-w-40 truncate sm:inline">{session.user.name}</span>
                <Badge variant="secondary">{roleLabel(role ?? "")}</Badge>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {(role === "MANAGER" || role === "ADMIN") && (
                  <>
                    <DropdownMenuItem render={<Link href="/manager/dishes" className="no-underline" />}>
                      <Soup data-icon="inline-start" />
                      Блюда
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link href="/manager/slots" className="no-underline" />}>
                      <Clock data-icon="inline-start" />
                      Слоты
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link href="/manager/reports" className="no-underline" />}>
                      <BarChart3 data-icon="inline-start" />
                      Отчёты
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
                  <LogOut data-icon="inline-start" />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm no-underline">Вход</Link>
            <Link href="/register">
              <Button>Регистрация</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
