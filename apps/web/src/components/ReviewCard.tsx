import { Card, Stack } from "@gql-book-review/shared-ui";
import type { DummyReview } from "../dummy";

type Props = {
  review: DummyReview;
  showBook?: boolean;
};

// 이 카드가 표시하는 필드: 작성자 이름·아바타, 별점, 본문, 좋아요 수, 내가 좋아요 눌렀는지
// showBook=true일 때만 책 표지·제목도 함께 표시 (홈 피드 / 유저 프로필용)
export function ReviewCard({ review, showBook = false }: Props) {
  return (
    <Card>
      <Stack gap={12}>
        {showBook && (
          <Stack direction="row" gap={8} align="center">
            <img src={review.book.coverUrl} alt="" width={32} height={48} />
            <strong>{review.book.title}</strong>
          </Stack>
        )}

        <Stack direction="row" gap={8} align="center">
          <img
            src={review.author.avatarUrl}
            alt=""
            width={24}
            height={24}
            style={{ borderRadius: 9999 }}
          />
          <span style={{ fontWeight: 600 }}>{review.author.name}</span>
          <span style={{ color: "#6b7280" }}>· {review.createdAt.slice(0, 10)}</span>
        </Stack>

        <div>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</div>
        <p style={{ margin: 0 }}>{review.content}</p>

        <Stack direction="row" gap={8} align="center">
          <span>{review.likedByMe ? "♥" : "♡"}</span>
          <span>{review.likeCount}</span>
        </Stack>
      </Stack>
    </Card>
  );
}
