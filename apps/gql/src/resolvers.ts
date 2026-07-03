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
        homeFeed: async (_parent: unknown, args: { first?: number; after?: string }, context: Context) => {
            if (!context.viewer) return { reviews: [], nextCursor: null }; // 비로그인 → 빈 피드 (에러 아님)
            
            const { items: followingIds } = await context.rest.get<{ items: string[] }>(`/users/${context.viewer.id}/following`);

            const perUser = await Promise.all(
                followingIds.map((id) =>
                    context.rest.get<{ items: unknown[]; total: number; page: number; pageSize: number }>(
                        `/users/${id}/reviews?page=1`,
                    ),
                ),
            );

            const all = perUser.flatMap((res) => res.items);
            all.sort((a,b) => b.createdAt.localeCompare(a.createdAt)); // 최신순 정렬

            const first = args.first ?? 10;
            const start = args.after ? Number(args.after) : 0;
            const slice = all.slice(start, start + first);
            const hasMore = start + first < all.length;

            return {
                reviews: slice,
                nextCursor: hasMore ? String(start + first) : null,
            };
        },
        book: (_parent: unknown, args: { id: string }, context: Context) => {
            return context.rest.get(`/books/${args.id}`);
        },
        user: (_parent: unknown, args: { id: string }, context: Context) => {
            return context.rest.get(`/users/${args.id}`);
        },
        search: async (_parent: unknown, args: { query: string; first?: number; after?: string }, context: Context) => {
            if (args.query.trim() === "") return { books: [], nextCursor: null }; // 빈 검색어 → 빈 결과 (에러 아님)
            const res = await context.rest.get<{ items: unknown[]; total: number; page: number; pageSize: number }>(
                `/books?q=${encodeURIComponent(args.query)}&page=1`,
            );
            const hasMore = res.page * res.pageSize < res.total;
            return {
                books: res.items,
                nextCursor: hasMore ? String(res.page + 1) : null,
            };
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
        // rest.get 대신 loader.load — 같은 tick 의 호출들이 batch 로 묶이고 중복 id 는 제거된다.
        author: (parent: { authorId: string }, _args: unknown, context: Context) => {
            return context.loaders.user.load(parent.authorId);
        },

        // raw Review 의 bookId → Book 객체로. (홈 피드/프로필에서 책 표지·제목용)
        book: (parent: { bookId: string }, _args: unknown, context: Context) => {
            return context.loaders.book.load(parent.bookId);
        },

        // viewer 파생 필드. 비로그인이면 false (Boolean! 이라 null 금지).
        // batch endpoint 가 있는 케이스 → loader 가 /me/likes 를 1번으로 묶는다.
        likedByMe: (parent: { id: string }, _args: unknown, context: Context) => {
            if (!context.viewer) return false;
            return context.loaders.liked.load(parent.id);
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
        },
        reviews: async (parent: { id: string }, args: { first?: number; after?: string }, context: Context) => {
            const page = args.after ? Number(args.after) : 1;
            const res = await context.rest.get<{ items: unknown[]; total: number; page: number; pageSize: number }>(
                `/users/${parent.id}/reviews?page=${page}`,
            );
            const hasMore = res.page * res.pageSize < res.total;
            return {
                reviews: res.items, // 각 item 은 아직 authorId/bookId 만 가진 raw Review
                nextCursor: hasMore ? String(res.page + 1) : null,
            };
        },
        followedByMe: async (parent: { id: string }, _args: unknown, context: Context) => {
            if (!context.viewer) return false;
            const { items: followingIds } = await context.rest.get<{ items: string[] }>(`/users/${context.viewer.id}/following`);
            return followingIds.includes(parent.id);
        }
    }
};

export type { Context };
