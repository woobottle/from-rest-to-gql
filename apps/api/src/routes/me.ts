import type { FastifyInstance } from "fastify";
import { requireViewer } from "../auth";
import { follows, likes } from "../data";

export async function meRoutes(app: FastifyInstance) {
  // GET /me/likes?reviewIds=r1,r2,r3 — 내가 좋아요한 리뷰 ID만 필터링
  app.get<{ Querystring: { reviewIds?: string } }>("/me/likes", async (req, reply) => {
    const viewer = requireViewer(req, reply);
    if (!viewer) return;
    const askedRaw = req.query.reviewIds ?? "";
    const asked = askedRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const liked = new Set(likes.filter((l) => l.userId === viewer.id).map((l) => l.reviewId));
    const items = asked.length === 0 ? [...liked] : asked.filter((id) => liked.has(id));
    reply.send({ items });
  });

  // GET /me/follows?userIds=u1,u2 — 내가 팔로우 중인 유저 ID만 필터링
  app.get<{ Querystring: { userIds?: string } }>("/me/follows", async (req, reply) => {
    const viewer = requireViewer(req, reply);
    if (!viewer) return;
    const askedRaw = req.query.userIds ?? "";
    const asked = askedRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const followed = new Set(
      follows.filter((f) => f.followerId === viewer.id).map((f) => f.followingId),
    );
    const items = asked.length === 0 ? [...followed] : asked.filter((id) => followed.has(id));
    reply.send({ items });
  });
}
