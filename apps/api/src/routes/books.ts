import type { FastifyInstance } from "fastify";
import { requireViewer } from "../auth";
import { books, reviews } from "../data";

export async function bookRoutes(app: FastifyInstance) {
  // GET /books?sort=&category=&q=&page=
  app.get<{
    Querystring: { sort?: string; category?: string; q?: string; page?: string };
  }>("/books", async (req, reply) => {
    const viewer = requireViewer(req, reply);
    if (!viewer) return;

    const { sort, category, q, page } = req.query;
    let list = [...books];

    if (category) list = list.filter((b) => b.category === category);
    if (q) {
      const needle = q.toLowerCase();
      list = list.filter(
        (b) => b.title.toLowerCase().includes(needle) || b.author.toLowerCase().includes(needle),
      );
    }
    if (sort === "popular") list.sort((a, b) => b.reviewCount - a.reviewCount);
    if (sort === "rating") list.sort((a, b) => b.averageRating - a.averageRating);

    const pageSize = 20;
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const start = (pageNum - 1) * pageSize;
    const items = list.slice(start, start + pageSize);

    reply.send({ items, total: list.length, page: pageNum, pageSize });
  });

  // GET /books/:id
  app.get<{ Params: { id: string } }>("/books/:id", async (req, reply) => {
    const viewer = requireViewer(req, reply);
    if (!viewer) return;

    const book = books.find((b) => b.id === req.params.id);
    if (!book) {
      reply.code(404).send({ error: "NotFound", message: "book not found" });
      return;
    }
    reply.send(book);
  });

  // GET /books/:id/reviews?page=
  app.get<{ Params: { id: string }; Querystring: { page?: string } }>(
    "/books/:id/reviews",
    async (req, reply) => {
      const viewer = requireViewer(req, reply);
      if (!viewer) return;

      const book = books.find((b) => b.id === req.params.id);
      if (!book) {
        reply.code(404).send({ error: "NotFound", message: "book not found" });
        return;
      }

      const all = reviews
        .filter((r) => r.bookId === req.params.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      const pageSize = 10;
      const pageNum = req.query.page ? Math.max(1, parseInt(req.query.page, 10)) : 1;
      const start = (pageNum - 1) * pageSize;
      const items = all.slice(start, start + pageSize);

      reply.send({ items, total: all.length, page: pageNum, pageSize });
    },
  );
}
