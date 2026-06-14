import assert from "node:assert/strict";
import test from "node:test";
import { createRestClient } from "./restClient";

test("body가 없는 DELETE 요청에는 Content-Type을 보내지 않는다", async () => {
  const originalFetch = globalThis.fetch;
  let requestInit: RequestInit | undefined;

  globalThis.fetch = async (_input, init) => {
    requestInit = init;
    return new Response(null, { status: 204 });
  };

  try {
    await createRestClient("u2").delete("/reviews/r1");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(requestInit?.headers, { "X-Viewer-Id": "u2" });
  assert.equal(requestInit?.body, undefined);
});

test("body가 있는 POST 요청에는 JSON Content-Type과 직렬화된 body를 보낸다", async () => {
  const originalFetch = globalThis.fetch;
  let requestInit: RequestInit | undefined;

  globalThis.fetch = async (_input, init) => {
    requestInit = init;
    return Response.json({ id: "r1" }, { status: 201 });
  };

  try {
    await createRestClient("u1").post("/reviews", {
      bookId: "b1",
      rating: 5,
      content: "좋아요",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(requestInit?.headers, {
    "Content-Type": "application/json",
    "X-Viewer-Id": "u1",
  });
  assert.equal(
    requestInit?.body,
    JSON.stringify({ bookId: "b1", rating: 5, content: "좋아요" }),
  );
});
