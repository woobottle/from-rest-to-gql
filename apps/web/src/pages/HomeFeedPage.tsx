import { useQuery } from "@apollo/client";
import { Stack } from "@gql-book-review/shared-ui";
import { ReviewCard } from "../components/ReviewCard";
import { graphql } from "../gql";

const HomeFeedQuery = graphql(`
  query HomeFeed($cursor: String) {
    homeFeed(first: 20, after: $cursor) {
      reviews {
        id
        ...ReviewCard_review
      }
      nextCursor
    }
  }
`);

export function HomeFeedPage() {
  const { data, loading, error } = useQuery(HomeFeedQuery);

  if (loading) return <div>불러오는 중…</div>;
  if (error) return <div>에러: {error.message}</div>;

  return (
    <Stack gap={16}>
      <h2 style={{ margin: 0 }}>홈 피드</h2>
      <p style={{ color: "#6b7280", margin: 0 }}>
        내가 팔로우한 사람들의 최근 리뷰입니다.
      </p>
      {data?.homeFeed.reviews.map((review) => (
        <ReviewCard key={review.id} review={review} showBook />
      ))}
    </Stack>
  );
}
