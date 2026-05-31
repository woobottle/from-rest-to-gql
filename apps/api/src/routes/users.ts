import type { FastifyInstance } from "fastify";
import { requireViewer } from "../auth";
import { follows, reviews, users } from "../data";

export async function userRoutes(app: FastifyInstance) {
  // GET /users/:id
  app.get<{ Params: { id: string } }>("/users/:id", async (req, reply) => {
    const viewer = requireViewer(req, reply);
    if (!viewer) return;
    const user = users.find((u) => u.id === req.params.id);
    if (!user) {
      reply.code(404).send({ error: "NotFound" });
      return;
    }
    const followerCount = follows.filter((f) => f.followingId === user.id).length;
    const followingCount = follows.filter((f) => f.followerId === user.id).length;
    const reviewCount = reviews.filter((r) => r.authorId === user.id).length;
    reply.send({ ...user, followerCount, followingCount, reviewCount });
  });

  // GET /users/:id/reviews?page=
  app.get<{ Params: { id: string }; Querystring: { page?: string } }>(
    "/users/:id/reviews",
    async (req, reply) => {
      const viewer = requireViewer(req, reply);
      if (!viewer) return;
      const user = users.find((u) => u.id === req.params.id);
      if (!user) {
        reply.code(404).send({ error: "NotFound" });
        return;
      }
      const all = reviews
        .filter((r) => r.authorId === user.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const pageSize = 10;
      const pageNum = req.query.page ? Math.max(1, parseInt(req.query.page, 10)) : 1;
      const start = (pageNum - 1) * pageSize;
      const items = all.slice(start, start + pageSize);
      reply.send({ items, total: all.length, page: pageNum, pageSize });
    },
  );

  // GET /users/:id/following → 그 사람이 팔로우하는 유저 ID 목록
  app.get<{ Params: { id: string } }>("/users/:id/following", async (req, reply) => {
    const viewer = requireViewer(req, reply);
    if (!viewer) return;
    const ids = follows.filter((f) => f.followerId === req.params.id).map((f) => f.followingId);
    reply.send({ items: ids });
  });

  // POST /users/:id/follow
  app.post<{ Params: { id: string } }>("/users/:id/follow", async (req, reply) => {
    const viewer = requireViewer(req, reply);
    if (!viewer) return;
    if (viewer.id === req.params.id) {
      reply.code(400).send({ error: "BadRequest", message: "cannot follow yourself" });
      return;
    }
    if (!users.some((u) => u.id === req.params.id)) {
      reply.code(404).send({ error: "NotFound" });
      return;
    }
    if (!follows.some((f) => f.followerId === viewer.id && f.followingId === req.params.id)) {
      follows.push({ followerId: viewer.id, followingId: req.params.id });
    }
    reply.send({ userId: req.params.id, followedByMe: true });
  });

  // DELETE /users/:id/follow
  app.delete<{ Params: { id: string } }>("/users/:id/follow", async (req, reply) => {
    const viewer = requireViewer(req, reply);
    if (!viewer) return;
    const idx = follows.findIndex(
      (f) => f.followerId === viewer.id && f.followingId === req.params.id,
    );
    if (idx >= 0) follows.splice(idx, 1);
    reply.send({ userId: req.params.id, followedByMe: false });
  });
}
