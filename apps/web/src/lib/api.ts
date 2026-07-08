/**
 * Typed API client. A single, thin fetch wrapper — no data-fetching logic
 * lives in components. Base URL is configurable via `VITE_API_BASE_URL`.
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new ApiError(res.status, `GET ${path} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

/* ---- Response types (kept in sync with the backend DTOs; generated from
   OpenAPI in a later milestone via packages/shared-types). ---- */

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  environment: string;
}

export interface CapabilitiesResponse {
  version: string;
  flags: Record<string, boolean>;
}
