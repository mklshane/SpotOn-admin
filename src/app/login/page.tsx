"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";

const schema = z.object({
  identifier: z.string().min(1, "Email or phone is required"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await login(values.identifier, values.password);
      router.replace("/facilities");
    } catch (e) {
      const message = e instanceof ApiError ? e.detail : "Login failed.";
      setError("root", { message });
    }
  };

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-gradient-to-b from-[#FFE9D6] via-[#FFD7C0] to-[#FFC3AC] p-6">
      <Card className="w-full max-w-sm border-none shadow-[0_12px_28px_rgb(122_74_43/0.16)]">
        <CardHeader>
          <Image
            src="/spoton-icon.png"
            alt="SpotOn"
            width={48}
            height={48}
            className="mb-2 size-12 rounded-xl shadow-[0_2px_8px_rgb(122_74_43/0.25)]"
          />
          <CardTitle className="font-heading text-xl font-bold tracking-tight">
            SpotOn Admin
          </CardTitle>
          <CardDescription>
            Sign in with your SpotOn account. Admin access required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="identifier">Email or phone</Label>
              <Input id="identifier" autoComplete="username" {...register("identifier")} />
              {errors.identifier && (
                <p className="text-sm text-destructive">{errors.identifier.message}</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
