import { tokenStore } from './auth';

/**
 * Cliente HTTP mínimo sobre fetch.
 * Adjunta Authorization: Bearer <token> si hay JWT guardado.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

export class ApiError extends Error {
  status: number;
  payload?: unknown;
  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export type QueryParams = { [key: string]: string | number | boolean | undefined | null };

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: QueryParams;
  signal?: AbortSignal;
}

/** Callback global para que el AuthContext se entere si el token expiró. */
let onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(cb: () => void) {
  onUnauthorized = cb;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {};
  if (opts.body) headers['Content-Type'] = 'application/json';
  const token = tokenStore.get();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url.toString(), {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });

  if (res.status === 401) {
    if (onUnauthorized) onUnauthorized();
  }

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    const message =
      (typeof payload === 'object' && payload && 'error' in payload
        ? (payload as { error: string }).error
        : String(payload)) || `HTTP ${res.status}`;
    throw new ApiError(res.status, message, payload);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, query?: QueryParams, signal?: AbortSignal) =>
    request<T>(path, { method: 'GET', query, signal }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
