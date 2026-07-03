import { useQuery } from "@apollo/client";
import { Card, Stack } from "@gql-book-review/shared-ui";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { ReviewCard } from "../components/ReviewCard";
import { graphql } from "../gql";

const BookDetailQuery = graphql(`
  query BookDetail($id: ID!, $cursor: String) {
    book(id: $id) {
      id
      title
      author
      coverUrl
      averageRating
      reviewCount
      description
      reviews(first: 20, after: $cursor) {
        reviews {
          id
          ...ReviewCard_review
        }
        nextCursor
      }
    }
  }
`);

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [expanded, setExpanded] = useState(false);
  const { data, loading, error } = useQuery(BookDetailQuery, {
    variables: { id: id! },
    skip: !id,
  });

  if (loading) return <div>불러오는 중…</div>;
  if (error) return <div>에러: {error.message}</div>;

  const book = data?.book;
  // book(id:)는 nullable → 못 찾으면 null. 스키마가 "없을 수 있다"고 말하므로 분기 강제.
  if (!book) return <div>책을 찾을 수 없어요.</div>;

  return (
    <Stack gap={16}>
      <Card>
        <Stack direction="row" gap={16}>
          <img src={book.coverUrl ?? undefined} alt="" width={120} height={180} />
          <Stack gap={8}>
            <h2 style={{ margin: 0 }}>{book.title}</h2>
            <span style={{ color: "#6b7280" }}>{book.author}</span>
            <span>
              ★ {book.averageRating.toFixed(1)} · 리뷰 {book.reviewCount}개
            </span>
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

      <h3 style={{ margin: "16px 0 0" }}>리뷰 {book.reviewCount}개</h3>
      {book.reviews.reviews.map((review) => (
        // 책 상세에서는 이미 어떤 책인지 알기 때문에 표지 중복 표시는 생략(showBook=false).
        <ReviewCard key={review.id} review={review} />
      ))}
    </Stack>
  );
}
