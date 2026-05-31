import type { FastifyReply, FastifyRequest } from "fastify";
import { users } from "./data";
import type { Role, User } from "./types";

declare module "fastify" {
  interface FastifyRequest {
    viewer?: User;
  }
}

// 학습 단순화를 위해 JWT 대신 `X-Viewer-Id` 헤더로 인증 흉내를 내요.
// 헤더가 없으면 401, 권한이 부족하면 403을 반환해요.
// 실제 운영 환경의 토큰 검증 로직은 이 과제의 학습 대상이 아니에요.
export function attachViewer(req: FastifyRequest): User | null {
  const id = req.headers["x-viewer-id"];
  if (typeof id !== "string") return null;
  const viewer = users.find((u) => u.id === id);
  if (!viewer) return null;
  req.viewer = viewer;
  return viewer;
}

export function requireViewer(req: FastifyRequest, reply: FastifyReply): User | null {
  const viewer = attachViewer(req);
  if (!viewer) {
    reply.code(401).send({ error: "Unauthorized", message: "X-Viewer-Id header required" });
    return null;
  }
  return viewer;
}

export function requireRole(req: FastifyRequest, reply: FastifyReply, role: Role): User | null {
  const viewer = requireViewer(req, reply);
  if (!viewer) return null;
  if (role === "admin" && viewer.role !== "admin") {
    reply.code(403).send({ error: "Forbidden", message: "admin role required" });
    return null;
  }
  return viewer;
}
