import { Stack } from "@gql-book-review/shared-ui";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { ViewerPicker } from "./components/ViewerPicker";
import { BookDetailPage } from "./pages/BookDetailPage";
import { HomeFeedPage } from "./pages/HomeFeedPage";
import { SearchPage } from "./pages/SearchPage";
import { UserProfilePage } from "./pages/UserProfilePage";

export function App() {
  return (
    <BrowserRouter>
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: 24,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            paddingBottom: 16,
            borderBottom: "1px solid #e5e7eb",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <Stack direction="row" gap={16} align="center">
            <strong>📚 책 리뷰 SNS</strong>
            <Link to="/">홈</Link>
            <Link to="/books/b1">책 상세 (예: b1)</Link>
            <Link to="/users/u3">유저 (예: u3)</Link>
            <Link to="/search">검색</Link>
          </Stack>
          <ViewerPicker />
        </header>

        <Routes>
          <Route path="/" element={<HomeFeedPage />} />
          <Route path="/books/:id" element={<BookDetailPage />} />
          <Route path="/users/:id" element={<UserProfilePage />} />
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
