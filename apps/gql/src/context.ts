import type { IncomingMessage } from "node:http";
import { createRestClient, type RestClient } from "./restClient";
import { createLoaders, type Loaders } from "./loaders";

export type Viewer = {
  id: string;
  name: string;
  role: "user" | "admin";
};

export type Context = {
  viewer: Viewer | null;
  rest: RestClient;
  loaders: Loaders;
};

// ─────────────────────────────────────────────────────────────
// Starter가 처리하는 부분 — 멘티는 이 코드를 수정할 일이 거의 없어요.
//
// `X-Viewer-Id` 헤더로 들어온 ID를 읽어서, REST의 `/auth/me`로
// viewer 정보를 한 번 조회한 뒤 context.viewer에 주입해요.
// resolver는 그냥 context.viewer를 읽어 쓰면 됩니다.
//
// REST 호출용 헬퍼(context.rest)도 같이 주입해요. 이 헬퍼는 자동으로
// X-Viewer-Id 헤더를 첨부하기 때문에, resolver는 path만 신경 쓰면 돼요.
//   예: const book = await context.rest.get(`/books/${id}`);
// ─────────────────────────────────────────────────────────────
export async function buildContext(req: IncomingMessage): Promise<Context> {
  const viewerId = headerValue(req, "x-viewer-id");
  const rest = createRestClient(viewerId);
  // ★ 요청마다 새 loaders. 이 객체는 이 요청 동안만 산다(request-scoped).
  const loaders = createLoaders(rest);
  if (!viewerId) {
    return { viewer: null, rest, loaders };
  }

  try {
    const me = await rest.get<Viewer>("/auth/me");
    return { viewer: me, rest, loaders };
  } catch {
    return { viewer: null, rest, loaders };
  }
}

function headerValue(req: IncomingMessage, name: string): string | null {
  const v = req.headers[name];
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}
