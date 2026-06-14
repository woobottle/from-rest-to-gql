import { useApolloClient, useMutation } from "@apollo/client";
import { Button, Card, Stack } from "@gql-book-review/shared-ui";
import { useState } from "react";
import { FragmentType, graphql, useFragment } from "../gql";
import { removeReviewFromCache } from "../lib/reviewCache";
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
      id
      ...UserAvatar_user
    }
    book {
      id
      title
      coverUrl
    }
  }
`)

const LikeReviewMutation = graphql(`
  mutation LikeReview($input: LikeReviewInput!) {
    likeReview(input: $input) {
      __typename
      ... on MutationError {
        message
      }
    }
  }
`);

const UnlikeReviewMutation = graphql(`
  mutation UnlikeReview($input: LikeReviewInput!) {
    unlikeReview(input: $input) {
      __typename
      ... on MutationError {
        message
      }
    }
  }
`);

const DeleteReviewMutation = graphql(`
  mutation DeleteReview($input: DeleteReviewInput!) {
    deleteReview(input: $input) {
      __typename
      ... on DeleteReviewSuccess {
        deletedReviewId
      }
      ... on MutationError {
        message
      }
    }
  }
`);

type Props = {
  review: FragmentType<typeof ReviewCard_review>;
  showBook?: boolean;
};

// 이 카드가 표시하는 필드: 작성자 이름·아바타, 별점, 본문, 좋아요 수, 내가 좋아요 눌렀는지
// showBook=true일 때만 책 표지·제목도 함께 표시 (홈 피드 / 유저 프로필용)
export function ReviewCard({ review: raw_review, showBook = false }: Props) {
  const review = useFragment(ReviewCard_review, raw_review);
  const client = useApolloClient();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [likeReview, { loading: liking }] = useMutation(LikeReviewMutation);
  const [unlikeReview, { loading: unliking }] = useMutation(UnlikeReviewMutation);
  const [deleteReview, { loading: deleting }] = useMutation(
    DeleteReviewMutation,
  );
  const likePending = liking || unliking;

  async function handleLikeToggle() {
    const nextLikedByMe = !review.likedByMe;
    const input = { reviewId: review.id };
    const startedAt = performance.now();
    setFeedback(null);

    try {
      if (nextLikedByMe) {
        const result = await likeReview({ variables: { input } });
        const payload = result.data?.likeReview;
        if (payload?.__typename !== "ReviewSuccess") {
          setFeedback(payload?.message ?? "좋아요 처리에 실패했습니다.");
          return;
        }
      } else {
        const result = await unlikeReview({ variables: { input } });
        const payload = result.data?.unlikeReview;
        if (payload?.__typename !== "ReviewSuccess") {
          setFeedback(payload?.message ?? "좋아요 처리에 실패했습니다.");
          return;
        }
      }

      await client.refetchQueries({ include: "active" });

      const elapsed = Math.round(performance.now() - startedAt);
      setFeedback(`완료 ${elapsed}ms`);
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "좋아요 처리에 실패했습니다.",
      );
    }
  }

  async function handleDelete() {
    if (!window.confirm("이 리뷰를 삭제할까요?")) return;
    setFeedback(null);

    try {
      const result = await deleteReview({
        variables: { input: { reviewId: review.id } },
        update(cache, { data }) {
          if (data?.deleteReview.__typename !== "DeleteReviewSuccess") return;
          removeReviewFromCache(cache, {
            reviewId: data.deleteReview.deletedReviewId,
            bookId: review.book.id,
            authorId: review.author.id,
          });
        },
      });
      const payload = result.data?.deleteReview;
      if (payload?.__typename !== "DeleteReviewSuccess") {
        setFeedback(payload?.message ?? "리뷰 삭제에 실패했습니다.");
      }
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "리뷰 삭제에 실패했습니다.",
      );
    }
  }

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
          <Button
            type="button"
            variant="ghost"
            disabled={likePending || deleting}
            onClick={handleLikeToggle}
            aria-label={review.likedByMe ? "좋아요 취소" : "좋아요"}
          >
            {review.likedByMe ? "♥" : "♡"} {review.likeCount}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={likePending || deleting}
            onClick={handleDelete}
          >
            {deleting ? "삭제 중…" : "삭제"}
          </Button>
        </Stack>
        {feedback && (
          <span style={{ color: "#6b7280", fontSize: 12 }}>{feedback}</span>
        )}
      </Stack>
    </Card>
  );
}
