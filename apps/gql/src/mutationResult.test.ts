import assert from "node:assert/strict";
import test from "node:test";
import { graphql } from "graphql";
import { RestError } from "./restClient";
import { schema } from "./schema";

function resultData(result: unknown): unknown {
  return JSON.parse(JSON.stringify(result));
}

test("deleteReview 권한 거부를 NotAuthorized 결과로 반환한다", async () => {
  const result = await graphql({
    schema,
    source: `
      mutation {
        deleteReview(input: { reviewId: "r1" }) {
          __typename
          ... on MutationError {
            message
          }
          ... on DeleteReviewSuccess {
            deletedReviewId
          }
        }
      }
    `,
    contextValue: {
      viewer: { id: "u2", name: "민준", role: "user" },
      rest: {
        delete: async () => {
          throw new RestError(403, {
            error: "Forbidden",
            message: "not your review",
          });
        },
      },
    },
  });

  assert.deepEqual(resultData(result), {
    data: {
      deleteReview: {
        __typename: "NotAuthorized",
        message: "권한이 없습니다.",
      },
    },
  });
});

test("입력 오류를 InvalidInput 결과로 반환한다", async () => {
  const result = await graphql({
    schema,
    source: `
      mutation {
        createReview(input: { bookId: "b1", rating: 6, content: "좋아요" }) {
          __typename
          ... on MutationError {
            message
          }
        }
      }
    `,
    contextValue: {
      viewer: { id: "u1", name: "서연", role: "user" },
      rest: {
        post: async () => {
          throw new RestError(400, {
            error: "BadRequest",
            message: "rating must be 1..5",
          });
        },
      },
    },
  });

  assert.deepEqual(resultData(result), {
    data: {
      createReview: {
        __typename: "InvalidInput",
        message: "rating must be 1..5",
      },
    },
  });
});

test("예상하지 못한 REST 오류는 GraphQL errors로 전파한다", async () => {
  const result = await graphql({
    schema,
    source: `
      mutation {
        deleteReview(input: { reviewId: "r1" }) {
          __typename
        }
      }
    `,
    contextValue: {
      viewer: { id: "u1", name: "서연", role: "user" },
      rest: {
        delete: async () => {
          throw new RestError(500, { error: "InternalServerError" });
        },
      },
    },
  });

  assert.equal(result.data, null);
  assert.equal(result.errors?.[0]?.message, "REST 500");
});
