import { createServer } from "node:http";
import { createYoga } from "graphql-yoga";
import { buildContext } from "./context";
import { schema } from "./schema";

const yoga = createYoga({
  schema,
  context: ({ request }) => {
    // GraphQL Yoga의 Fetch API request → Node IncomingMessage 호환을 위한 헤더 어댑터
    const headers: Record<string, string> = {};
    request.headers.forEach((v, k) => {
      headers[k.toLowerCase()] = v;
    });
    return buildContext({ headers } as any);
  },
  graphqlEndpoint: "/graphql",
  landingPage: false,
});

const port = 4000;
const server = createServer(yoga);
server.listen(port, () => {
  console.log(`🧩 GraphQL ready at http://localhost:${port}/graphql`);
});
