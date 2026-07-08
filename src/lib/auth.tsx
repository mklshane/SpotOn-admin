"use client";

// Auth context: login via the backend's /auth endpoints, tokens in
// localStorage (see client.ts). Only is_admin users may enter — the API
// enforces this on every /admin request; the check here is UX.

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { api, ApiError, tokenStore } from "@/lib/api/client";
import type { TokenOut, UserOut } from "@/lib/api/types";

interface AuthContextValue {
  user: UserOut | null;
  ready: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Hydration-safe: localStorage only exists client-side, so the stored
    // session must be read after mount — SSR and first client render agree
    // on user=null, then this flips ready.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(tokenStore.user);
    setReady(true);
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const tokens = await api.post<TokenOut>("/auth/login", { identifier, password });
    if (!tokens.user.is_admin) {
      throw new ApiError(
        403,
        JSON.stringify({
          detail:
            "This account is not an admin. Promote it in Supabase: update users set is_admin = true where email = '…';",
        }),
      );
    }
    tokenStore.save(tokens);
    setUser(tokens.user);
  }, []);

  const logout = useCallback(async () => {
    const refresh = tokenStore.refresh;
    if (refresh) {
      try {
        await api.post("/auth/logout", { refresh_token: refresh });
      } catch {
        // best-effort; clear locally regardless
      }
    }
    tokenStore.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
