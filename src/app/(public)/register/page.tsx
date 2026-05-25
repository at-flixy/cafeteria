"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { registerSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormValues = {
  fullName: string;
  email: string;
  password: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const form = useForm<FormValues>({
    defaultValues: { fullName: "", email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      toast.error("Проверьте данные формы");
      return;
    }
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!response.ok) {
      toast.error("Не удалось зарегистрироваться");
      return;
    }
    await signIn("credentials", { email: values.email, password: values.password, redirect: false });
    router.push("/");
    router.refresh();
  });

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center">
      <Card className="w-full rounded-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Регистрация клиента</CardTitle>
          <CardDescription>Аккаунт создаётся локально в SQLite.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fullName">ФИО</Label>
              <Input id="fullName" {...form.register("fullName")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Пароль</Label>
              <Input id="password" type="password" {...form.register("password")} />
            </div>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Создаём..." : "Зарегистрироваться"}
            </Button>
            <Link href="/login" className="text-center text-sm text-primary no-underline hover:underline">Уже есть аккаунт</Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
