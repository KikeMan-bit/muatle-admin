// Muatle's backend (Django REST Framework), version prefix included. A blank
// value in the env file counts as none.
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/+$/, "");

const UNREACHABLE = "No pudimos conectar con el servidor de Muatle. Revisa tu conexión e inténtalo de nuevo.";
const SERVER_FAILED = "Algo falló en el servidor. Inténtalo de nuevo en unos minutos.";
const FAILED = "Algo salió mal. Inténtalo de nuevo.";

/**
 * A request the backend turned down, or one that never reached it (`status`
 * 0). `message` is always fit to show as is; `fields` holds the first message
 * of each field the backend complained about.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly fields: Partial<Record<string, string>>;
  /** Seconds before it may be tried again, when the request was throttled. */
  readonly retryAfter: number | undefined;

  constructor(message: string, status: number, fields: Partial<Record<string, string>> = {}, retryAfter?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
    this.retryAfter = retryAfter;
  }
}

/** What to tell the person about a failed request, whatever was thrown. */
export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : FAILED;
}

/** "45 segundos", "1 minuto", "12 minutos". */
function waitLabel(seconds: number): string {
  if (seconds === 1) return "1 segundo";
  if (seconds < 60) return `${seconds} segundos`;
  const minutes = Math.ceil(seconds / 60);
  return minutes === 1 ? "1 minuto" : `${minutes} minutos`;
}

// DRF reports a problem as { field: ["message"] }, { detail: "message" } or a
// bare ["message"].
function firstMessage(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return firstMessage(value[0]);
  return undefined;
}

function fieldMessages(data: unknown): Partial<Record<string, string>> {
  const fields: Partial<Record<string, string>> = {};
  if (data && typeof data === "object" && !Array.isArray(data)) {
    for (const [field, value] of Object.entries(data)) {
      const message = firstMessage(value);
      if (message) fields[field] = message;
    }
  }
  return fields;
}

export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Calls the backend and returns its answer (`null` when there is none, as
 * after a delete). The body goes as JSON. Anything but a success comes back
 * as an `ApiError`.
 */
export async function apiRequest<T = unknown>(
  path: string,
  {
    method = "GET",
    body,
    token,
  }: {
    method?: ApiMethod;
    body?: unknown;
    /** The session's API token, sent as `Authorization: Token …`. */
    token?: string;
  } = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Token ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(UNREACHABLE, 0);
  }

  const data: unknown = await response.json().catch(() => null);
  if (response.ok) return data as T;

  const fields = fieldMessages(data);
  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("Retry-After")) || 60;
    throw new ApiError(
      `Hiciste demasiados intentos. Vuelve a intentarlo en ${waitLabel(retryAfter)}.`,
      response.status,
      fields,
      retryAfter,
    );
  }
  if (response.status >= 500) {
    throw new ApiError(SERVER_FAILED, response.status, fields);
  }
  const message = firstMessage(data) ?? fields.detail ?? fields.non_field_errors ?? Object.values(fields)[0];
  throw new ApiError(message ?? FAILED, response.status, fields);
}

/** The query string of a list's filters, leaving out what is empty. */
export function queryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
