import type { Context } from "./context";

// ─────────────────────────────────────────────────────────────
// 👇 멘티가 채워 넣을 자리
//
// Step 3에서 스키마의 각 type/field에 대한 resolver를 작성합니다.
// REST 호출은 context.rest.get(...) 처럼 starter가 제공하는 헬퍼를 사용하세요.
// viewer는 context.viewer로 접근하세요.
// ─────────────────────────────────────────────────────────────

// ── field-level authorization 헬퍼 ──
// resolver 마다 if (ctx.viewer?.id === ...) 를 흩뿌리면 누락이 생긴다.
// 정책을 한 곳에 모아두고 각 필드는 이걸 호출만 한다.
const isSelf = (context: Context, ownerId: string) => context.viewer?.id === ownerId;
const isAdmin = (context: Context) => context.viewer?.role === "admin";

export const resolvers: Record<string, unknown> = {
    Query: {
        book: (_parent: unknown, args: { id: string }, context: Context) => {
            return context.rest.get(`/books/${args.id}`);
        }
    },

    Book: {
        // REST 응답 { items, total, page, pageSize } 을
        // 스키마 모양 { reviews, nextCursor } 으로 "번역"해서 반환.
        reviews: async (parent: { id: string }, args: { first?: number; after?: string }, context: Context) => {
            const page = args.after ? Number(args.after) : 1;
            const res = await context.rest.get<{ items: unknown[]; total: number; page: number; pageSize: number }>(
                `/books/${parent.id}/reviews?page=${page}`,
            );
            const hasMore = res.page * res.pageSize < res.total;
            return {
                reviews: res.items, // 각 item 은 아직 authorId/bookId 만 가진 raw Review
                nextCursor: hasMore ? String(res.page + 1) : null,
            };
        }
    },

    Review: {
        // raw Review 의 authorId → User 객체로. (★ 리뷰마다 1번씩 = 순진한 N+1)
        author: (parent: { authorId: string }, _args: unknown, context: Context) => {
            return context.rest.get(`/users/${parent.authorId}`);
        },

        // viewer 파생 필드. 비로그인이면 false (Boolean! 이라 null 금지).
        likedByMe: async (parent: { id: string }, _args: unknown, context: Context) => {
            if (!context.viewer) return false;
            const res = await context.rest.get<{ items: string[] }>(`/me/likes?reviewIds=${parent.id}`);
            return res.items.includes(parent.id);
        },

        // ── viewer 의존 가시성 필드 ──
        // 작성자 본인만. 남이 보면 null. "안 보임"은 정상 상태라 throw 아님.
        // (스키마에서 nullable String 으로 둔 게 이 정책을 가능하게 함)
        draftContent: (parent: { authorId: string; draftContent: string | null }, _args: unknown, context: Context) => {
            return isSelf(context, parent.authorId) ? parent.draftContent : null;
        },

        // admin 만. 일반 유저에겐 null.
        reportCount: (parent: { reportCount: number }, _args: unknown, context: Context) => {
            return isAdmin(context) ? parent.reportCount : null;
        }
    },

    User: {
        // 본인만 email 노출. 남의 프로필에선 null (정상 상태).
        email: (parent: { id: string; email: string }, _args: unknown, context: Context) => {
            return isSelf(context, parent.id) ? parent.email : null;
        },

        // admin 만 운영 필드(정지 시각) 노출.
        bannedAt: (parent: { bannedAt: string | null }, _args: unknown, context: Context) => {
            return isAdmin(context) ? parent.bannedAt : null;
        }
    }
};

export type { Context };
