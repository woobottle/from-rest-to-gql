import type { FastifyInstance } from "fastify";
import { requireRole, requireViewer } from "../auth";
import { books, comments, likes, reviews, users } from "../data";

function nextReviewId(): string {
  const max = reviews
    .map((r) => parseInt(r.id.slice(1), 10))
    .filter((n) => !Number.isNaN(n))
    .reduce((a, b) => Math.max(a, b), 0);
  return `r${max + 1}`;
}

function recomputeBookAggregates(bookId: string) {
  const bookReviews = reviews.filter((r) => r.bookId === bookId);
  const book = books.find((b) => b.id === bookId);
  if (!book) return;
  book.reviewCount = bookReviews.length;
  book.averageRating =
    bookReviews.length === 0
      ? 0
      : Math.round((bookReviews.reduce((s, r) => s + r.rating, 0) / bookReviews.length) * 10) / 10;
}

export async function reviewRoutes(app: FastifyInstance) {
  // GET /reviews/:id
  app.get<{ Params: { id: string } }>("/reviews/:id", async (req, reply) => {
    const viewer = requireViewer(req, reply);
    if (!viewer) return;
    const review = reviews.find((r) => r.id === req.params.id);
    if (!review) {
      reply.code(404).send({ error: "NotFound" });
      return;
    }
    reply.send(review);
  });

  // GET /reviews/:id/comments
  app.get<{ Params: { id: string } }>("/reviews/:id/comments", async (req, reply) => {
    const viewer = requireViewer(req, reply);
    if (!viewer) return;
    const review = reviews.find((r) => r.id === req.params.id);
    if (!review) {
      reply.code(404).send({ error: "NotFound" });
      return;
    }
    const list = comments
      .filter((c) => c.reviewId === req.params.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    reply.send({ items: list, total: list.length });
  });

  // POST /reviews { bookId, rating, content }
  app.post<{ Body: { bookId?: string; rating?: number; content?: string } }>(
    "/reviews",
    async (req, reply) => {
      const viewer = requireViewer(req, reply);
      if (!viewer) return;
      const { bookId, rating, content } = req.body ?? {};
      if (!bookId || !rating || !content) {
        reply.code(400).send({ error: "BadRequest", message: "bookId, rating, content required" });
        return;
      }
      if (!books.some((b) => b.id === bookId)) {
        reply.code(404).send({ error: "NotFound", message: "book not found" });
        return;
      }
      if (rating < 1 || rating > 5) {
        reply.code(400).send({ error: "BadRequest", message: "rating must be 1..5" });
        return;
      }
      const now = new Date().toISOString();
      const review = {
        id: nextReviewId(),
        bookId,
        authorId: viewer.id,
        rating,
        content,
        draftContent: null,
        reportCount: 0,
        likeCount: 0,
        commentCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      reviews.unshift(review);
      recomputeBookAggregates(bookId);
      reply.code(201).send(review);
    },
  );

  // PATCH /reviews/:id { rating?, content? }
  app.patch<{ Params: { id: string }; Body: { rating?: number; content?: string } }>(
    "/reviews/:id",
    async (req, reply) => {
      const viewer = requireViewer(req, reply);
      if (!viewer) return;
      const review = reviews.find((r) => r.id === req.params.id);
      if (!review) {
        reply.code(404).send({ error: "NotFound" });
        return;
      }
      if (review.authorId !== viewer.id && viewer.role !== "admin") {
        reply.code(403).send({ error: "Forbidden", message: "not your review" });
        return;
      }
      const { rating, content } = req.body ?? {};
      if (rating != null) {
        if (rating < 1 || rating > 5) {
          reply.code(400).send({ error: "BadRequest" });
          return;
        }
        review.rating = rating;
      }
      if (content != null) review.content = content;
      review.updatedAt = new Date().toISOString();
      recomputeBookAggregates(review.bookId);
      reply.send(review);
    },
  );

  // DELETE /reviews/:id
  app.delete<{ Params: { id: string } }>("/reviews/:id", async (req, reply) => {
    const viewer = requireViewer(req, reply);
    if (!viewer) return;
    const idx = reviews.findIndex((r) => r.id === req.params.id);
    if (idx < 0) {
      reply.code(404).send({ error: "NotFound" });
      return;
    }
    const review = reviews[idx]!;
    if (review.authorId !== viewer.id && viewer.role !== "admin") {
      reply.code(403).send({ error: "Forbidden", message: "not your review" });
      return;
    }
    reviews.splice(idx, 1);
    // 좋아요·댓글도 정리
    for (let i = likes.length - 1; i >= 0; i--) {
      if (likes[i]!.reviewId === review.id) likes.splice(i, 1);
    }
    for (let i = comments.length - 1; i >= 0; i--) {
      if (comments[i]!.reviewId === review.id) comments.splice(i, 1);
    }
    recomputeBookAggregates(review.bookId);
    reply.code(204).send();
  });

  // POST /reviews/:id/likes
  app.post<{ Params: { id: string } }>("/reviews/:id/likes", async (req, reply) => {
    const viewer = requireViewer(req, reply);
    if (!viewer) return;
    const review = reviews.find((r) => r.id === req.params.id);
    if (!review) {
      reply.code(404).send({ error: "NotFound" });
      return;
    }
    if (!likes.some((l) => l.userId === viewer.id && l.reviewId === review.id)) {
      likes.push({ userId: viewer.id, reviewId: review.id });
      review.likeCount += 1;
    }
    reply.send({ reviewId: review.id, likeCount: review.likeCount, likedByMe: true });
  });

  // DELETE /reviews/:id/likes
  app.delete<{ Params: { id: string } }>("/reviews/:id/likes", async (req, reply) => {
    const viewer = requireViewer(req, reply);
    if (!viewer) return;
    const review = reviews.find((r) => r.id === req.params.id);
    if (!review) {
      reply.code(404).send({ error: "NotFound" });
      return;
    }
    const idx = likes.findIndex((l) => l.userId === viewer.id && l.reviewId === review.id);
    if (idx >= 0) {
      likes.splice(idx, 1);
      review.likeCount = Math.max(0, review.likeCount - 1);
    }
    reply.send({ reviewId: review.id, likeCount: review.likeCount, likedByMe: false });
  });

  // (admin) POST /reviews/:id/ban — 작성자 제재
  app.post<{ Params: { id: string } }>("/reviews/:id/ban", async (req, reply) => {
    const viewer = requireRole(req, reply, "admin");
    if (!viewer) return;
    const review = reviews.find((r) => r.id === req.params.id);
    if (!review) {
      reply.code(404).send({ error: "NotFound" });
      return;
    }
    const author = users.find((u) => u.id === review.authorId);
    if (author) author.bannedAt = new Date().toISOString();
    reply.send({ reviewId: review.id, bannedAt: author?.bannedAt ?? null });
  });
}
