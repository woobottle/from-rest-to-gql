import type { ApolloCache, NormalizedCacheObject } from "@apollo/client";

type RemovedReview = {
  reviewId: string;
  bookId: string;
  authorId: string;
};

function entityId(
  cache: ApolloCache<NormalizedCacheObject>,
  __typename: "Book" | "Review" | "User",
  id: string,
): string | undefined {
  return cache.identify({ __typename, id });
}

export function removeReviewFromCache(
  cache: ApolloCache<NormalizedCacheObject>,
  review: RemovedReview,
): void {
  cache.evict({ id: entityId(cache, "Review", review.reviewId) });

  for (const [typename, id] of [
    ["Book", review.bookId],
    ["User", review.authorId],
  ] as const) {
    cache.modify({
      id: entityId(cache, typename, id),
      fields: {
        reviewCount: (count: number = 0) => Math.max(0, count - 1),
      },
    });
  }

  cache.gc();
}
