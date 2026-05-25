"use client";

import { Clock } from "lucide-react";
import type { TimeSlotDto } from "@/lib/client-types";
import { cn } from "@/lib/utils";

export function SlotPicker({
  slots,
  value,
  onChange,
}: {
  slots: TimeSlotDto[];
  value: string;
  onChange: (slotId: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {slots.map((slot) => {
        const left = Math.max(0, slot.orderLimit - slot.reservedCount);
        const selected = slot.id === value;
        return (
          <button
            key={slot.id}
            type="button"
            disabled={left === 0}
            onClick={() => onChange(slot.id)}
            className={cn(
              "flex flex-col gap-2 rounded-lg border bg-card p-4 text-left transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-50",
              selected && "border-primary ring-2 ring-primary/25",
            )}
          >
            <span className="flex items-center gap-2 font-medium">
              <Clock className="size-4" />
              {slot.startTime}-{slot.endTime}
            </span>
            <span className="text-sm text-muted-foreground">Осталось мест: {left}</span>
            {selected && <span className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">Выбрано</span>}
          </button>
        );
      })}
    </div>
  );
}
