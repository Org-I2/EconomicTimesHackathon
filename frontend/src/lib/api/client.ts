/** Base API client — centralizes fetch, auth header injection, and standard error parsing */
import type { ApiError } from '@/types/api';

const BASE_URL = 'http://localhost:8000/api/v1';

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

/** Get the current auth token from Zustand store (imported lazily to avoid circular deps) */
function getAuthToken(): string | null {
  // ASSUMPTION: Reading token from localStorage since Zustand store may not be initialized
  // at the time of API calls during SSR/init. The authStore persists token here.
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
  const headers: Record<string, string> = {
    ...customHeaders,
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/** Parse error response into ApiClientError */
async function parseError(response: Response): Promise<ApiClientError> {
  try {
    const body: ApiError = await response.json();
    return new ApiClientError(
      response.status,
      body.error?.code || 'UNKNOWN_ERROR',
      body.error?.message || response.statusText,
      body.error?.details || {}
    );
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

  // Build URL with query params
  let url = `${BASE_URL}${path}`;
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
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    signal,
  });

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    throw await parseError(response);
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

/** SSE (Server-Sent Events) helper for streaming /chat responses */
export async function* streamSSE(
  path: string,
  body: unknown,
  signal?: AbortSignal
): AsyncGenerator<string, void, unknown> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;
        yield data;
      }
    }
  }
}

export default apiClient;
