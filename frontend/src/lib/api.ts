/**
 * Thin fetch wrapper around the Partnernet API.
 *
 * - Access + refresh tokens live in localStorage (the API is on a different
 *   origin, so httpOnly cookies would need extra CORS/CSRF plumbing; for this
 *   app localStorage is a reasonable trade-off).
 * - A 401 triggers a single transparent refresh-and-retry.
 */
import type { User } from "./types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

const ACCESS_KEY = "pn.access";
const REFRESH_KEY = "pn.refresh";

export const tokenStore = {
  get access() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh?: string) {
    window.localStorage.setItem(ACCESS_KEY, access);
    if (refresh) window.localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, data: unknown) {
    super(fmtError(data) || `Request failed (${status})`);
    this.status = status;
    this.data = data;
  }
}

function fmtError(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const obj = data as Record<string, unknown>;
  if (typeof obj.detail === "string") return obj.detail;
  const first = Object.entries(obj)[0];
  if (!first) return "";
  const [key, val] = first;
  const msg = Array.isArray(val) ? val[0] : val;
  return key === "non_field_errors" ? String(msg) : `${key}: ${msg}`;
}

async function refreshAccess(): Promise<boolean> {
  const refresh = tokenStore.refresh;
  if (!refresh) return false;
  const res = await fetch(`${BASE_URL}/api/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) {
    tokenStore.clear();
    return false;
  }
  const data = await res.json();
  tokenStore.set(data.access, data.refresh);
  return true;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  query?: Record<string, string | number | undefined | null>;
  isRetry?: boolean;
}

export async function apiFetch<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, auth = true, query } = opts;

  let url = `${BASE_URL}${path}`;
  if (query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {};
  const isForm = body instanceof FormData;
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
  if (auth && tokenStore.access) {
    headers["Authorization"] = `Bearer ${tokenStore.access}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });

  if (res.status === 401 && auth && !opts.isRetry && tokenStore.refresh) {
    if (await refreshAccess()) {
      return apiFetch<T>(path, { ...opts, isRetry: true });
    }
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

// --- Auth ---------------------------------------------------------------

export async function login(email: string, password: string) {
  const data = await apiFetch<{ access: string; refresh: string; user: User }>(
    "/api/auth/login/",
    { method: "POST", body: { email, password }, auth: false },
  );
  tokenStore.set(data.access, data.refresh);
  return data.user;
}

export async function register(
  email: string,
  password: string,
  full_name: string,
) {
  await apiFetch<User>("/api/auth/register/", {
    method: "POST",
    body: { email, password, full_name },
    auth: false,
  });
  return login(email, password);
}

export async function fetchMe() {
  return apiFetch<User>("/api/auth/me/");
}

export function logout() {
  tokenStore.clear();
}
