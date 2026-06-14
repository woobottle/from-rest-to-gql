import type { Context } from "./context";
import { RestError } from "./restClient";

// ── union payload 헬퍼 ──
// "예상 가능한 비즈니스 실패"(잘못된 입력/미인증/권한없음/대상없음)만 데이터로 돌려준다.
// REST 의 400/401/403/404 status 를 union 의 에러 멤버로 번역한다.
// 그 외(500, 네트워크 등)는 진짜 예외 → 다시 throw 해서 GraphQL errors[] 로.
type ErrorMember = {
    __typename: "InvalidInput" | "NotAuthenticated" | "NotAuthorized" | "NotFound";
    message: string;
};
const notAuthenticated = (): ErrorMember => ({ __typename: "NotAuthenticated", message: "로그인이 필요합니다." });

function restErrorMessage(err: RestError, fallback: string): string {
    if (
        typeof err.body === "object"
        && err.body !== null
        && "message" in err.body
        && typeof err.body.message === "string"
    ) {
        return err.body.message;
    }
    return fallback;
}

function restErrorToMember(err: unknown): ErrorMember {
    if (err instanceof RestError) {
        if (err.status === 400) {
            return {
                __typename: "InvalidInput",
                message: restErrorMessage(err, "입력값이 올바르지 않습니다."),
            };
        }
        if (err.status === 401) return notAuthenticated();
        if (err.status === 403) return { __typename: "NotAuthorized", message: "권한이 없습니다." };
        if (err.status === 404) return { __typename: "NotFound", message: "대상을 찾을 수 없습니다." };
    }
    throw err; // 예상 못 한 실패는 진짜 예외로 취급 → errors[]
}

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

type RawReview = {
    createdAt: string;
    [key: string]: unknown;
};

export const resolvers = {
    Query: {
        homeFeed: async (_parent: unknown, args: { first?: number; after?: string }, context: Context) => {
            if (!context.viewer) return { reviews: [], nextCursor: null }; // 비로그인 → 빈 피드 (에러 아님)
            
            const { items: followingIds } = await context.rest.get<{ items: string[] }>(`/users/${context.viewer.id}/following`);

            const perUser = await Promise.all(
                followingIds.map((id) =>
                    context.rest.get<{ items: RawReview[]; total: number; page: number; pageSize: number }>(
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
    },

    // ── Mutation ──
    // 모든 mutation 이 같은 정책을 따른다(일관성):
    //   1) 잘못된 입력(REST 400)  → InvalidInput 멤버
    //   2) viewer 없음/REST 401   → NotAuthenticated 멤버
    //   3) 권한 없음(REST 403)    → NotAuthorized 멤버
    //   4) 대상 없음(REST 404)    → NotFound 멤버
    //   5) 성공                   → *Success 멤버
    //   6) 그 외(서버 장애 등)    → throw (errors[])
    // 본인/admin 검사는 REST(/reviews PATCH·DELETE)가 이미 403 으로 막아주므로,
    // resolver 는 그 status 를 union 멤버로 "번역"만 한다(검사 로직 중복 X).
    Mutation: {
        createReview: async (_parent: unknown, args: { input: { bookId: string; rating: number; content?: string } }, context: Context) => {
            if (!context.viewer) return notAuthenticated();
            try {
                const review = await context.rest.post(`/reviews`, args.input);
                return { __typename: "ReviewSuccess", review };
            } catch (err) {
                return restErrorToMember(err);
            }
        },
        updateReview: async (_parent: unknown, args: { input: { reviewId: string; rating?: number; content?: string } }, context: Context) => {
            if (!context.viewer) return notAuthenticated();
            const { reviewId, ...patch } = args.input;
            try {
                const review = await context.rest.patch(`/reviews/${reviewId}`, patch); // 남의 리뷰면 REST 가 403 → NotAuthorized
                return { __typename: "ReviewSuccess", review };
            } catch (err) {
                return restErrorToMember(err);
            }
        },
        deleteReview: async (_parent: unknown, args: { input: { reviewId: string } }, context: Context) => {
            if (!context.viewer) return notAuthenticated();
            try {
                await context.rest.delete(`/reviews/${args.input.reviewId}`); // 본인/admin 아니면 REST 가 403 → NotAuthorized
                return { __typename: "DeleteReviewSuccess", deletedReviewId: args.input.reviewId };
            } catch (err) {
                return restErrorToMember(err);
            }
        },
        likeReview: async (_parent: unknown, args: { input: { reviewId: string } }, context: Context) => {
            if (!context.viewer) return notAuthenticated();
            try {
                await context.rest.post(`/reviews/${args.input.reviewId}/likes`);
                context.loaders.liked.clear(args.input.reviewId); // 좋아요 상태 바뀜 → 로더 캐시 초기화
                // 변경된 review 를 돌려줘서 Apollo 캐시(likeCount/likedByMe)가 갱신되게 한다.
                const review = await context.rest.get(`/reviews/${args.input.reviewId}`);
                return { __typename: "ReviewSuccess", review };
            } catch (err) {
                return restErrorToMember(err);
            }
        },
        unlikeReview: async (_parent: unknown, args: { input: { reviewId: string } }, context: Context) => {
            if (!context.viewer) return notAuthenticated();
            try {
                await context.rest.delete(`/reviews/${args.input.reviewId}/likes`);
                context.loaders.liked.clear(args.input.reviewId);
                const review = await context.rest.get(`/reviews/${args.input.reviewId}`);
                return { __typename: "ReviewSuccess", review };
            } catch (err) {
                return restErrorToMember(err);
            }
        },
        followUser: async (_parent: unknown, args: { input: { userId: string } }, context: Context) => {
            if (!context.viewer) return notAuthenticated();
            try {
                await context.rest.post(`/users/${args.input.userId}/follow`);
                context.loaders.user.clear(args.input.userId); // 팔로우 상태 바뀜 → 로더 캐시 초기화
                const user = await context.rest.get(`/users/${args.input.userId}`);
                return { __typename: "UserSuccess", user };
            } catch (err) {
                return restErrorToMember(err);
            }
        },
        unfollowUser: async (_parent: unknown, args: { input: { userId: string } }, context: Context) => {
            if (!context.viewer) return notAuthenticated();
            try {
                await context.rest.delete(`/users/${args.input.userId}/follow`);
                context.loaders.user.clear(args.input.userId);
                const user = await context.rest.get(`/users/${args.input.userId}`);
                return { __typename: "UserSuccess", user };
            } catch (err) {
                return restErrorToMember(err);
            }
        }
    }
};

export type { Context };
