// Fetch wrapper ported from SpotOn-frontend/src/api/client.ts, adapted for the
// admin site: localStorage token store, mutexed refresh (the backend ROTATES
// refresh tokens — a concurrent double-refresh would revoke the new token and
// log the user out), array query params, and DELETE support.

import type { TokenOut, UserOut } from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`API ${status}: ${body.slice(0, 200)}`);
    this.name = "ApiError";
  }

  /** Best-effort human message from a FastAPI `{ "detail": ... }` body. */
  get detail(): string {
    try {
      const parsed = JSON.parse(this.body);
      if (typeof parsed?.detail === "string") return parsed.detail;
      if (Array.isArray(parsed?.detail)) {
        return parsed.detail
          .map((d: { loc?: unknown[]; msg?: string }) =>
            [d.loc?.slice(1).join("."), d.msg].filter(Boolean).join(": "),
          )
          .join("; ");
      }
    } catch {
      // not JSON
    }
    return this.body || `Request failed (${this.status}).`;
  }
}

// --- Token store (localStorage; internal tool — the API enforces real security) ---

const ACCESS_KEY = "spoton_admin_access_token";
const REFRESH_KEY = "spoton_admin_refresh_token";
const USER_KEY = "spoton_admin_user";

export const tokenStore = {
  get access(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_KEY);
  },
  get user(): UserOut | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserOut;
    } catch {
      return null;
    }
  },
  save(tokens: TokenOut): void {
    localStorage.setItem(ACCESS_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
    localStorage.setItem(USER_KEY, JSON.stringify(tokens.user));
  },
  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

// --- Refresh (mutexed one-shot) ----------------------------------------------------

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refresh = tokenStore.refresh;
      if (!refresh) return null;
      try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ refresh_token: refresh }),
        });
        if (!res.ok) {
          tokenStore.clear();
          return null;
        }
        const tokens = (await res.json()) as TokenOut;
        tokenStore.save(tokens); // rotating: persist the NEW pair immediately
        return tokens.access_token;
      } catch {
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

// --- Request core -------------------------------------------------------------------

type QueryValue = string | number | boolean | undefined | null;
export type QueryParams = Record<string, QueryValue | QueryValue[]>;

function queryString(params?: QueryParams): string {
  if (!params) return "";
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    const values = Array.isArray(v) ? v : [v];
    for (const value of values) {
      if (value === undefined || value === null || value === "") continue;
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

async function request<T>(
  method: string,
  path: string,
  opts: { params?: QueryParams; body?: unknown; _retried?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  const token = tokenStore.access;
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}${queryString(opts.params)}`, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  // One-shot refresh-and-retry on an expired access token.
  if (res.status === 401 && token && !opts._retried) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request<T>(method, path, { ...opts, _retried: true });
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, await res.text().catch(() => ""));
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/**
 * Authenticated binary GET (research images, CSV export). Same bearer token and
 * shared mutexed refresh as `request`; returns the body as a Blob so callers can
 * use object URLs — the token never goes into an <img src> or link href.
 */
async function requestBlob(
  path: string,
  opts: { params?: QueryParams; _retried?: boolean } = {},
): Promise<Blob> {
  const headers: Record<string, string> = {};
  const token = tokenStore.access;
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}${queryString(opts.params)}`, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (res.status === 401 && token && !opts._retried) {
    const newToken = await refreshAccessToken();
    if (newToken) return requestBlob(path, { ...opts, _retried: true });
  }

  if (!res.ok) {
    throw new ApiError(res.status, await res.text().catch(() => ""));
  }
  return res.blob();
}

export const api = {
  get: <T>(path: string, params?: QueryParams) => request<T>("GET", path, { params }),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, { body }),
  del: <T = void>(path: string, params?: QueryParams, body?: unknown) =>
    request<T>("DELETE", path, { params, body }),
  blob: (path: string, params?: QueryParams) => requestBlob(path, { params }),
};
