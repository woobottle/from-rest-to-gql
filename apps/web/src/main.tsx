import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import {
  ApolloClient,
  ApolloProvider,
  HttpLink,
  InMemoryCache,
} from "@apollo/client";
import { getViewerId } from "./viewer";

const root = document.getElementById("root");
if (!root) throw new Error("root not found");

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({
    // GraphQL Yoga 서버. Yoga가 CORS를 열어둬서 브라우저에서 바로 호출돼요.
    uri: "http://localhost:4000/graphql",
    // 인증은 학습 대상이 아니라 헤더 한 줄로 끝.
    // 상단 ViewerPicker로 고른 viewer가 그대로 실려 나가요(u1, u2 …).
    headers: {
      "X-Viewer-Id": getViewerId(),
    },
  }),
});

createRoot(root).render(
  <StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </StrictMode>,
);
