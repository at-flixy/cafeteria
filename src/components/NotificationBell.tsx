"use client";

import Link from "next/link";
import useSWR from "swr";
import { Bell } from "lucide-react";
import type { NotificationDto } from "@/lib/client-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) return [];
  return response.json() as Promise<NotificationDto[]>;
};

export function NotificationBell() {
  const { data } = useSWR("/api/notifications", fetcher, { refreshInterval: 15000 });
  const unread = data?.filter((item) => !item.readAt).length ?? 0;

  return (
    <Link href="/notifications" className="relative inline-flex">
      <Button size="icon" variant="ghost" aria-label="Уведомления">
        <Bell data-icon="inline-start" />
      </Button>
      {unread > 0 && (
        <Badge className="absolute -right-1 -top-1 h-5 min-w-5 border-background bg-red-600 px-1 text-white">
          {unread}
        </Badge>
      )}
    </Link>
  );
}
