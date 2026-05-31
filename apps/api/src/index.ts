import cors from "@fastify/cors";
import Fastify from "fastify";
import { authRoutes } from "./routes/auth";
import { bookRoutes } from "./routes/books";
import { meRoutes } from "./routes/me";
import { reviewRoutes } from "./routes/reviews";
import { userRoutes } from "./routes/users";

const app = Fastify({ logger: { level: "info" } });

await app.register(cors, {
  origin: true,
  credentials: true,
  allowedHeaders: ["Content-Type", "X-Viewer-Id", "Authorization"],
});

await app.register(authRoutes);
await app.register(bookRoutes);
await app.register(reviewRoutes);
await app.register(userRoutes);
await app.register(meRoutes);

const port = 4100;
try {
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`📚 REST API listening on http://localhost:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
