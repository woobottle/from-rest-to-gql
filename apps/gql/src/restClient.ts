// ─────────────────────────────────────────────────────────────
// Starter가 제공하는 REST 클라이언트.
//
// resolver 안에서 REST API를 호출할 때 이 헬퍼를 쓰세요.
// X-Viewer-Id 헤더를 자동으로 첨부하고, 401/403을 던집니다.
//
// 사용 예:
//   const book = await context.rest.get<Book>(`/books/${id}`);
//   const review = await context.rest.post<Review>("/reviews", { bookId, rating, content });
// ─────────────────────────────────────────────────────────────

export const REST_BASE_URL = process.env.REST_BASE_URL ?? "http://localhost:4100";

export type RestClient = {
  get: <T = unknown>(path: string) => Promise<T>;
  post: <T = unknown>(path: string, body?: unknown) => Promise<T>;
  patch: <T = unknown>(path: string, body?: unknown) => Promise<T>;
  delete: <T = unknown>(path: string) => Promise<T>;
};

export class RestError extends Error {
  constructor(public status: number, public body: unknown, message?: string) {
    super(message ?? `REST ${status}`);
  }
}

export function createRestClient(viewerId: string | null): RestClient {
  const baseHeaders: Record<string, string> = { "Content-Type": "application/json" };
  if (viewerId) baseHeaders["X-Viewer-Id"] = viewerId;

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${REST_BASE_URL}${path}`, {
      method,
      headers: baseHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    const parsed = text ? JSON.parse(text) : undefined;
    if (!res.ok) throw new RestError(res.status, parsed);
    return parsed as T;
  }

  return {
    get: (path) => request("GET", path),
    post: (path, body) => request("POST", path, body),
    patch: (path, body) => request("PATCH", path, body),
    delete: (path) => request("DELETE", path),
  };
}
