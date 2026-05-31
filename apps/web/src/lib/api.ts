import { getViewerId } from "../viewer";

// ─────────────────────────────────────────────────────────────
// 👇 Step 1에서 멘티가 채워 넣을 자리
//
// 이 파일은 4개 화면이 사용할 공통 REST fetch 헬퍼예요.
// 다음 두 가지만 구현하면 충분해요:
//   1) base URL을 붙여서 GET 요청
//   2) X-Viewer-Id 헤더 자동 첨부 (이미 viewer.ts에서 가져옴)
//   3) 응답이 ok가 아니면 throw, ok이면 JSON 파싱
//
// 학습 포커스를 흐리지 않도록 react-query / swr 같은 건 일부러 쓰지 마세요.
// 페이지 컴포넌트에서 useEffect + fetch로 직접 부르는 게 통증을 가장 정직하게 보여줘요.
// ─────────────────────────────────────────────────────────────

export const REST_BASE_URL = "http://localhost:4100";

export async function apiGet<T>(path: string): Promise<T> {
  // TODO: implement
  // 힌트:
  //   const res = await fetch(`${REST_BASE_URL}${path}`, {
  //     headers: { "X-Viewer-Id": getViewerId() },
  //   });
  //   if (!res.ok) throw new Error(`${res.status} ${path}`);
  //   return res.json();
  throw new Error("apiGet not implemented");
}

// 참고용 — 멘티가 직접 호출에서 호출 수를 보고 싶을 때 쓸 수 있는 헬퍼
export function withViewerHeader(headers: Record<string, string> = {}) {
  return { ...headers, "X-Viewer-Id": getViewerId() };
}
