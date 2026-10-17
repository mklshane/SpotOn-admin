"use client";

// Client-side guard: middleware can't read localStorage, and this is an
// internal tool — the API enforces real security on every /admin request.

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

const NAV = [
  { href: "/facilities", label: "Facilities" },
  { href: "/doctors", label: "Doctors" },
  { href: "/platforms", label: "Platforms" },
  { href: "/reports", label: "Reports" },
];

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, ready, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) return null;

  return (
    <div className="flex min-h-screen w-full">
      <aside className="flex w-56 shrink-0 flex-col border-r bg-sidebar p-4">
        <div className="mb-6 flex items-center gap-2.5 px-2">
          <Image
            src="/spoton-icon.png"
            alt="SpotOn"
            width={32}
            height={32}
            className="size-8 shrink-0 rounded-[10px] shadow-[0_2px_8px_rgb(122_74_43/0.25)]"
          />
          <div>
            <div className="font-heading text-base font-bold leading-tight tracking-tight">
              SpotOn Admin
            </div>
            <div className="text-xs text-muted-foreground">Directory management</div>
          </div>
        </div>
        <nav className="grid gap-1">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                  active && "bg-accent font-medium text-accent-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto grid gap-2 px-2">
          <div className="truncate text-xs text-muted-foreground" title={user.email ?? ""}>
            {user.email ?? user.phone ?? "admin"}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await logout();
              router.replace("/login");
            }}
          >
            Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-auto p-8">{children}</main>
    </div>
  );
}
