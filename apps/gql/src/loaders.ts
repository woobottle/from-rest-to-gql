import DataLoader from "dataloader";
import type { RestClient } from "./restClient";

// ─────────────────────────────────────────────────────────────
// DataLoader — 같은 tick 안에 모인 .load(id) 들을 batch 함수 한 번으로 처리.
// 같은 id 가 여러 번 들어오면 자동으로 중복 제거(dedup)도 해준다.
//
// ★ 반드시 요청마다 새로 만들어야 한다(request-scoped).
//   모듈 top-level 에 두면 요청 사이에 캐시가 새서 인증/권한 사고가 난다.
//   → createLoaders 를 buildContext 안에서 매 요청 호출한다.
//
// batch 함수 규칙: 반환 배열은 입력 key 배열과 "같은 길이·같은 순서"여야 한다.
// ─────────────────────────────────────────────────────────────

export type Loaders = ReturnType<typeof createLoaders>;

export function createLoaders(rest: RestClient) {
  return {
    // /users/:id 는 batch endpoint 가 없다 → batch 함수 안에서 Promise.all 로 N번.
    // 호출 수 자체는 안 줄지만, 같은 id 중복 호출은 DataLoader 가 없애준다.
    user: new DataLoader<string, unknown>(async (ids) => {
      console.log(`[loader] user batch → ${ids.length}건`, ids);
      return Promise.all(ids.map((id) => rest.get(`/users/${id}`)));
    }),

    book: new DataLoader<string, unknown>(async (ids) => {
      console.log(`[loader] book batch → ${ids.length}건`, ids);
      return Promise.all(ids.map((id) => rest.get(`/books/${id}`)));
    }),

    // /me/likes?reviewIds=r1,r2,... 는 batch endpoint 가 있다 → 진짜 1번 호출로 묶인다.
    // 응답(items)은 "좋아요한 id 들"이라, 각 입력 id 를 boolean 으로 매핑.
    liked: new DataLoader<string, boolean>(async (reviewIds) => {
      console.log(`[loader] liked batch → ${reviewIds.length}건 (REST 1번)`, reviewIds);
      const res = await rest.get<{ items: string[] }>(
        `/me/likes?reviewIds=${reviewIds.join(",")}`,
      );
      const likedSet = new Set(res.items);
      return reviewIds.map((id) => likedSet.has(id)); // key 순서대로 boolean
    }),
  };
}
