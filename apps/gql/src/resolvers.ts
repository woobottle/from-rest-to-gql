import type { Context } from "./context";

// ─────────────────────────────────────────────────────────────
// 👇 멘티가 채워 넣을 자리
//
// Step 3에서 스키마의 각 type/field에 대한 resolver를 작성합니다.
// REST 호출은 context.rest.get(...) 처럼 starter가 제공하는 헬퍼를 사용하세요.
// viewer는 context.viewer로 접근하세요.
// ─────────────────────────────────────────────────────────────

export const resolvers = {
  Query: {
    hello: (_parent: unknown, _args: unknown, _ctx: Context) => "world",
  },
};
