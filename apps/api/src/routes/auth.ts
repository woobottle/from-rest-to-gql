import type { FastifyInstance } from "fastify";
import { attachViewer, requireViewer } from "../auth";
import { users } from "../data";

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/login { username } → 단순히 username으로 viewer를 찾아 id를 돌려줘요.
  // 학습 단순화를 위해 비밀번호 검증은 없고, 클라이언트는 받은 id를 이후 요청의
  // X-Viewer-Id 헤더에 그대로 실어 보내면 돼요.
  app.post<{ Body: { username?: string } }>("/auth/login", async (req, reply) => {
    const { username } = req.body ?? {};
    if (!username) {
      reply.code(400).send({ error: "BadRequest", message: "username required" });
      return;
    }
    const user = users.find((u) => u.name === username || u.id === username);
    if (!user) {
      reply.code(404).send({ error: "NotFound", message: "user not found" });
      return;
    }
    reply.send({ viewerId: user.id, user });
  });

  // GET /auth/me
  app.get("/auth/me", async (req, reply) => {
    const viewer = requireViewer(req, reply);
    if (!viewer) return;
    reply.send(viewer);
  });

  // (편의용) GET /auth/users — 로그인 화면용 유저 목록
  app.get("/auth/users", async (req, reply) => {
    attachViewer(req);
    reply.send(users.map((u) => ({ id: u.id, name: u.name, avatarUrl: u.avatarUrl, role: u.role })));
  });
}
