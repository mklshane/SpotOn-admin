"use client";

// Minimal labeled-field wrapper (shadcn v4 dropped the RHF `form` component;
// react-hook-form's register/Controller are used directly in pages).

import { Label } from "@/components/ui/label";

export function Field({
  label,
  htmlFor,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className ?? "grid gap-1.5"}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function errText(e: unknown): string {
  if (e && typeof e === "object" && "detail" in e) {
    return String((e as { detail: string }).detail);
  }
  return e instanceof Error ? e.message : "Something went wrong.";
}
