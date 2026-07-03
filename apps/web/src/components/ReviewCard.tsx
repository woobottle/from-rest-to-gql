import { Card, Stack } from "@gql-book-review/shared-ui";
import { FragmentType, graphql, useFragment } from "../gql";
import { UserAvatar } from "./UserAvatar";

export const ReviewCard_review = graphql(`
  fragment ReviewCard_review on Review {
    id
    rating
    content
    likeCount
    likedByMe
    createdAt
    author {
      ...UserAvatar_user
    }
    book {
      id
      title
      coverUrl
    }
  }
`)

type Props = {
  review: FragmentType<typeof ReviewCard_review>;
  showBook?: boolean;
};

// 이 카드가 표시하는 필드: 작성자 이름·아바타, 별점, 본문, 좋아요 수, 내가 좋아요 눌렀는지
// showBook=true일 때만 책 표지·제목도 함께 표시 (홈 피드 / 유저 프로필용)
export function ReviewCard({ review: raw_review, showBook = false }: Props) {
  const review = useFragment(ReviewCard_review, raw_review);

  return (
    <Card>
      <Stack gap={12}>
        {showBook && (
          <Stack direction="row" gap={8} align="center">
            <img src={review.book.coverUrl ?? undefined} alt="" width={32} height={48} />
            <strong>{review.book.title}</strong>
          </Stack>
        )}

        <Stack direction="row" gap={8} align="center">
          {/* review.author는 UserAvatar_user의 마스킹된 참조 → 그대로 넘기면 끝.
              ReviewCard는 author의 name/avatarUrl을 직접 읽지 못해요(마스킹). */}
          <UserAvatar user={review.author} />
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
