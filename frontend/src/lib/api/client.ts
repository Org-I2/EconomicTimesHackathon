/**
 * Base API client — centralizes fetch, auth header injection, and standard error parsing.
 *
 * Uses API_BASE_URL from config.ts:
 * - In development: empty string → Vite proxy routes /api/* → http://127.0.0.1:8000
 * - In production: set VITE_API_BASE_URL → full backend URL (e.g. https://xyz.onrender.com)
 */
import { API_BASE_URL } from './config';

/** Normalized error thrown by all API calls */
export class ApiClientError extends Error {
  code: string;
  status: number;
  details: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** Get the current auth token from localStorage (persisted by Zustand authStore) */
function getAuthToken(): string | null {
  try {
    const stored = localStorage.getItem('auth-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed?.state?.token ?? null;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

/** Build headers for a request */
function buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...customHeaders };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/** Parse error response into ApiClientError */
async function parseError(response: Response): Promise<ApiClientError> {
  try {
    const body = await response.json();
    // FastAPI error format: { detail: string | object }
    const detail = body?.detail;
    const message = typeof detail === 'string' ? detail : JSON.stringify(detail) || response.statusText;
    return new ApiClientError(response.status, `HTTP_${response.status}`, message, body);
  } catch {
    return new ApiClientError(
      response.status,
      'UNKNOWN_ERROR',
      response.statusText || 'An unexpected error occurred',
      {}
    );
  }
}

/** Core fetch wrapper with error handling */
async function request<T>(
  method: string,
  path: string,
  options: {
    body?: unknown;
    headers?: Record<string, string>;
    params?: Record<string, string | number | boolean | undefined>;
    signal?: AbortSignal;
  } = {}
): Promise<T> {
  const { body, headers: customHeaders, params, signal } = options;

  // Build full URL: API_BASE_URL + path (+ optional query params)
  let url = `${API_BASE_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const headers = buildHeaders(customHeaders);
  if (body && !(body instanceof FormData) && !(body instanceof URLSearchParams)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers,
    body:
      body instanceof FormData || body instanceof URLSearchParams
        ? body
        : body
        ? JSON.stringify(body)
        : undefined,
    signal,
  });

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    const err = await parseError(response);
    // 401: Force logout
    if (response.status === 401) {
      localStorage.removeItem('auth-storage');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    throw err;
  }

  return response.json() as Promise<T>;
}

/** Typed HTTP methods */
export const apiClient = {
  get: <T>(path: string, params?: Record<string, string | number | boolean | undefined>, signal?: AbortSignal) =>
    request<T>('GET', path, { params, signal }),

  post: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>('POST', path, { body, headers }),

  put: <T>(path: string, body?: unknown) =>
    request<T>('PUT', path, { body }),

  delete: <T>(path: string) =>
    request<T>('DELETE', path),

  /** Upload files as multipart/form-data */
  upload: <T>(path: string, formData: FormData) =>
    request<T>('POST', path, { body: formData }),
};

export default apiClient;
