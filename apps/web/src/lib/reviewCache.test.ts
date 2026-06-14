import { gql, InMemoryCache } from "@apollo/client/core/index.js";
import assert from "node:assert/strict";
import test from "node:test";
import { removeReviewFromCache } from "./reviewCache";

test("삭제된 리뷰를 목록에서 제거하고 관련 reviewCount를 감소시킨다", () => {
  const cache = new InMemoryCache();
  const HomeFeedSeedQuery = gql`
    query HomeFeedSeed {
      homeFeed {
        reviews {
          id
        }
      }
    }
  `;
  const BookCountFragment = gql`
    fragment BookCount on Book {
      reviewCount
    }
  `;
  const UserCountFragment = gql`
    fragment UserCount on User {
      reviewCount
    }
  `;

  cache.writeQuery({
    query: HomeFeedSeedQuery,
    data: {
      homeFeed: {
        __typename: "ReviewConnection",
        reviews: [
          { __typename: "Review", id: "r1" },
          { __typename: "Review", id: "r2" },
        ],
      },
    },
  });
  cache.writeFragment({
    id: "Book:b1",
    fragment: BookCountFragment,
    data: { __typename: "Book", reviewCount: 3 },
  });
  cache.writeFragment({
    id: "User:u1",
    fragment: UserCountFragment,
    data: { __typename: "User", reviewCount: 5 },
  });

  removeReviewFromCache(cache, {
    reviewId: "r1",
    bookId: "b1",
    authorId: "u1",
  });

  assert.deepEqual(cache.readQuery({ query: HomeFeedSeedQuery }), {
    homeFeed: {
      __typename: "ReviewConnection",
      reviews: [{ __typename: "Review", id: "r2" }],
    },
  });
  assert.deepEqual(
    cache.readFragment({ id: "Book:b1", fragment: BookCountFragment }),
    { __typename: "Book", reviewCount: 2 },
  );
  assert.deepEqual(
    cache.readFragment({ id: "User:u1", fragment: UserCountFragment }),
    { __typename: "User", reviewCount: 4 },
  );
});

test("리뷰 entity를 식별할 수 없으면 ROOT_QUERY를 삭제하지 않는다", () => {
  const cache = new InMemoryCache({
    typePolicies: {
      Review: { keyFields: false },
    },
  });
  const HomeFeedSeedQuery = gql`
    query UnnormalizedHomeFeedSeed {
      homeFeed {
        reviews {
          id
        }
      }
    }
  `;
  const data = {
    homeFeed: {
      __typename: "ReviewConnection",
      reviews: [{ __typename: "Review", id: "r1" }],
    },
  };
  cache.writeQuery({ query: HomeFeedSeedQuery, data });

  removeReviewFromCache(cache, {
    reviewId: "r1",
    bookId: "b1",
    authorId: "u1",
  });

  assert.deepEqual(cache.readQuery({ query: HomeFeedSeedQuery }), data);
});
