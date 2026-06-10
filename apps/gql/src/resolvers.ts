import type { Context } from "./context";

// ─────────────────────────────────────────────────────────────
// 👇 멘티가 채워 넣을 자리
//
// Step 3에서 스키마의 각 type/field에 대한 resolver를 작성합니다.
// REST 호출은 context.rest.get(...) 처럼 starter가 제공하는 헬퍼를 사용하세요.
// viewer는 context.viewer로 접근하세요.
// ─────────────────────────────────────────────────────────────

// Step 3 에서 각 type/field 의 resolver 를 채운다.
// Step 2(스키마 설계)에서는 비워 둬도 GraphiQL introspection/자동완성은 동작한다.
// (참고: Context 는 Step 3 resolver 에서 context.rest / context.viewer 로 쓰인다.)
export const resolvers: Record<string, unknown> = {};

export type { Context };
