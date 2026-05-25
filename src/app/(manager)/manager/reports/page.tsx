"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ReportDto } from "@/lib/client-types";
import { formatSom } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Отчёт недоступен");
  return response.json() as Promise<ReportDto>;
};

const colors = ["#d97706", "#f97316", "#f59e0b", "#84cc16", "#dc2626"];

export default function ManagerReportsPage() {
  const [type, setType] = useState<"daily" | "weekly">("daily");
  const [mounted, setMounted] = useState(false);
  const { data } = useSWR(`/api/manager/reports?type=${type}`, fetcher);

  useEffect(() => setMounted(true), []);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-3xl font-semibold">Отчёты</h1><p className="mt-2 text-muted-foreground">Продажи, выручка и загрузка слотов.</p></div>
        <Select value={type} onValueChange={(value) => setType(value as "daily" | "weekly")}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Период" /></SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="daily">День</SelectItem>
              <SelectItem value="weekly">Неделя</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle>Заказы</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{data?.totals.orders ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle>Выручка</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{formatSom(data?.totals.revenue ?? 0)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Выдано</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{data?.totals.issued ?? 0}</CardContent></Card>
      </div>
      <Tabs defaultValue="dishes">
        <TabsList>
          <TabsTrigger value="dishes">Топ блюд</TabsTrigger>
          <TabsTrigger value="revenue">Выручка</TabsTrigger>
          <TabsTrigger value="slots">Слоты</TabsTrigger>
        </TabsList>
        <TabsContent value="dishes">
          <Card className="rounded-lg"><CardHeader><CardTitle>Топ блюд</CardTitle></CardHeader><CardContent className="h-80">
            {mounted && <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.topDishes ?? []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="quantity" fill="#d97706" /></BarChart>
            </ResponsiveContainer>}
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="revenue">
          <Card className="rounded-lg"><CardHeader><CardTitle>Выручка по дням</CardTitle></CardHeader><CardContent className="h-80">
            {mounted && <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.revenueByDay ?? []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} /></LineChart>
            </ResponsiveContainer>}
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="slots">
          <Card className="rounded-lg"><CardHeader><CardTitle>Загрузка слотов</CardTitle></CardHeader><CardContent className="h-80">
            {mounted && <ResponsiveContainer width="100%" height="100%">
              <PieChart><Tooltip /><Pie data={(data?.slotLoad ?? []).map((slot) => ({ name: slot.slot, value: slot.reserved }))} dataKey="value" outerRadius={110} label>
                {(data?.slotLoad ?? []).map((slot, index) => <Cell key={slot.slot} fill={colors[index % colors.length]} />)}
              </Pie></PieChart>
            </ResponsiveContainer>}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
