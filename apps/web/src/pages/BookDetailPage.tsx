import { Card, Stack } from "@gql-book-review/shared-ui";
import { useEffect, useState } from "react";
import { ReviewCard } from "../components/ReviewCard";
import { dummyBookDetail } from "../dummy";
import { apiGet } from "../lib/api";

// ─────────────────────────────────────────────────────────────
// Step 1에서 채워 넣을 자리:
//   - 아래 `data`를 REST 호출 결과로 교체하세요.
//   - 화면이 필요로 하는 데이터:
//     * 상단: 책 표지·제목·평균평점만 큰 영역, 설명은 접힘
//     * 하단: 리뷰 목록 — 작성자 이름·아바타 / 별점 / 본문 / 좋아요 수 / 내 좋아요 여부
//
// 힌트:
//   1) GET /books/:id → 책 1개 (description, ISBN 등 풀 페이로드)
//      → 화면이 안 쓰는 필드의 비율을 측정해서 README에 적기
//   2) GET /books/:id/reviews → 리뷰 목록 (작성자는 authorId만)
//   3) 각 리뷰의 작성자 → GET /users/:id × N (waterfall + N+1)
//   4) GET /me/likes?reviewIds=... → 내 좋아요 여부
// ─────────────────────────────────────────────────────────────

export function BookDetailPage() {
  const [expanded, setExpanded] = useState(false);
  const [book, setBook] = useState();
  const [reviews, setReviews] = useState([]);
  
  useEffect(() => {
    const fetchBookDetail = async () => { 
      const bookId = 'b1'; // 실제로는 URL에서 ID를 읽어와야겠죠?
      const bookRes = await apiGet(`/books/${bookId}`);
      const reviewsRes = await apiGet(`/books/${bookId}/reviews`);
      const reviews = reviewsRes.items;
      for (const r of reviews) {
        const author = await apiGet(`/users/${r.authorId}`);
        r.author = author;
      }
      for (const r of reviews) {
        const likeRes = await apiGet(`/me/likes?reviewIds=${r.id}`);
        r.likedByMe = likeRes.items.includes(r.id);
      }
      setBook(bookRes);
      setReviews(reviews);
    };
    fetchBookDetail();
  }, []);

  if(book === undefined) {
    return <div>Loading...</div>;
  }

  return (
    <Stack gap={16}>
      <Card>
        <Stack direction="row" gap={16}>
          <img src={book.coverUrl} alt="" width={120} height={180} />
          <Stack gap={8}>
            <h2 style={{ margin: 0 }}>{book.title}</h2>
            <span style={{ color: "#6b7280" }}>{book.author}</span>
            <span>★ {book.averageRating.toFixed(1)} · 리뷰 {book.reviewCount}개</span>
            <button
              onClick={() => setExpanded((v) => !v)}
              style={{ alignSelf: "flex-start", marginTop: 8 }}
            >
              {expanded ? "설명 접기" : "설명 보기"}
            </button>
            {expanded && <p style={{ marginTop: 8 }}>{book.description}</p>}
          </Stack>
        </Stack>
      </Card>

      <h3 style={{ margin: "16px 0 0" }}>리뷰 {reviews.length}개</h3>
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </Stack>
  );
}
