"use client";

// Client-side guard: middleware can't read localStorage, and this is an
// internal tool — the API enforces real security on every /admin request.

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
      <aside className="flex w-52 shrink-0 flex-col border-r bg-muted/30 p-4">
        <div className="mb-6 px-2">
          <div className="text-lg font-semibold">SpotOn Admin</div>
          <div className="text-xs text-muted-foreground">Directory management</div>
        </div>
        <nav className="grid gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-2 py-1.5 text-sm hover:bg-accent",
                pathname.startsWith(item.href) && "bg-accent font-medium",
              )}
            >
              {item.label}
            </Link>
          ))}
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
      <main className="flex-1 overflow-x-auto p-6">{children}</main>
    </div>
  );
}
