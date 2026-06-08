import { Stack } from "@gql-book-review/shared-ui";
import { ReviewCard } from "../components/ReviewCard";
import { dummyFeed, DummyReview } from "../dummy";
import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";
import { getViewerId } from "../viewer";


// ─────────────────────────────────────────────────────────────
// Step 1에서 채워 넣을 자리:
//   - 아래 `data`를 REST 호출 결과로 교체하세요.
//   - 화면이 필요로 하는 데이터: "내가 팔로우한 사람들의 최근 리뷰".
//     각 카드: 책 표지·제목 / 별점 / 본문 / 작성자 이름·아바타 / 좋아요 수 / 내 좋아요 여부
//
// 힌트:
//   1) GET /users/:id/following → 팔로우 ID 목록
//   2) 각 ID로 GET /users/:id/reviews?page=1 → 최근 리뷰
//   3) 모인 리뷰의 책/작성자 정보를 각 ID로 GET
//   4) GET /me/likes?reviewIds=... → 내 좋아요 여부
//   5) DevTools Network 탭에서 호출 수와 waterfall 깊이를 측정해서 README에 적기
// ─────────────────────────────────────────────────────────────

export function HomeFeedPage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const currentViewerId = getViewerId();
    const fetchFollowing = async () => {
      const followers = await apiGet(`/users/${currentViewerId}/following`);
      const reviews = [];
      for (const f of followers.items) {
        const res = await apiGet(`/users/${f}/reviews?page=1`);
        reviews.push(...res.items);
      }
      for (const r of reviews) {
        const book = await apiGet(`/books/${r.bookId}`);
        r.book = book;
        const author = await apiGet(`/users/${r.authorId}`);
        r.author = author;
      }
      for (const r of reviews) {
        const likeRes = await apiGet(`/me/likes?reviewIds=${r.id}`);
        r.likedByMe = likeRes.items.includes(r.id);
      }
      setData(reviews);
    };
    fetchFollowing();
  }, []);

  return (
    <Stack gap={16}>
      <h2 style={{ margin: 0 }}>홈 피드</h2>
      <p style={{ color: "#6b7280", margin: 0 }}>
        내가 팔로우한 사람들의 최근 리뷰입니다.
      </p>
      {data.map((review) => (
        <ReviewCard key={review.id} review={review} showBook />
      ))}
    </Stack>
  );
}
