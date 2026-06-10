import { Stack } from "@gql-book-review/shared-ui";
import { useEffect, useState } from "react";
import { BookCard } from "../components/BookCard";
import { apiGet } from "../lib/api";

// ─────────────────────────────────────────────────────────────
// Step 1에서 채워 넣을 자리:
//   - 아래 `results`를 REST 호출 결과로 교체하세요.
//   - 화면이 필요로 하는 데이터: 책 카드 5개 (id, title, coverUrl, averageRating)
//   - 응답에 description, ISBN, 출판사, 카테고리 등이 다 같이 옵니다.
//     → over-fetch 비율을 측정해서 README에 적기
//
// 힌트:
//   1) GET /books?q=<검색어>&page=1 → 결과 목록
// ─────────────────────────────────────────────────────────────

export function SearchPage() {
  const [q, setQ] = useState("");
  // TODO: 검색어가 바뀔 때 GET /books?q=... 호출해서 results 교체
  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetchResults = async () => {
      if (q.trim() === "") {
        setResults([]);
        return;
      }
      const res = await apiGet(`/books?q=${encodeURIComponent(q)}&page=1`);
      setResults(res.items);
    };
    fetchResults();
  }, [q]);

  return (
    <Stack gap={16}>
      <h2 style={{ margin: 0 }}>검색</h2>
      <input
        placeholder="책 제목이나 저자로 검색"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ padding: "8px 12px", maxWidth: 400 }}
      />
      <Stack direction="row" gap={12}>
        {results.slice(0, 5).map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </Stack>
    </Stack>
  );
}
