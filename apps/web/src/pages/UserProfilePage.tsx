import { useQuery } from "@apollo/client";
import { Card, Stack } from "@gql-book-review/shared-ui";
import { useParams } from "react-router-dom";
import { ReviewCard } from "../components/ReviewCard";
import { graphql } from "../gql";

const UserProfileQuery = graphql(`
  query UserProfile($id: ID!, $cursor: String) {
    user(id: $id) {
      id
      name
      avatarUrl
      bio
      followerCount
      followingCount
      reviewCount
      followedByMe
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

export function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery(UserProfileQuery, {
    variables: { id: id! },
    skip: !id,
  });

  if (loading) return <div>불러오는 중…</div>;
  if (error) return <div>에러: {error.message}</div>;

  const user = data?.user;
  if (!user) return <div>유저를 찾을 수 없어요.</div>;

  return (
    <Stack gap={16}>
      <Card>
        <Stack direction="row" gap={16} align="center">
          <img
            src={user.avatarUrl ?? undefined}
            alt=""
            width={80}
            height={80}
            style={{ borderRadius: 9999 }}
          />
          <Stack gap={4}>
            <h2 style={{ margin: 0 }}>{user.name}</h2>
            <span style={{ color: "#6b7280" }}>{user.bio}</span>
            <span>
              팔로워 {user.followerCount} · 팔로잉 {user.followingCount} · 리뷰{" "}
              {user.reviewCount}
            </span>
            <button style={{ marginTop: 8, alignSelf: "flex-start" }}>
              {user.followedByMe ? "팔로잉" : "팔로우"}
            </button>
          </Stack>
        </Stack>
      </Card>

      <h3 style={{ margin: "16px 0 0" }}>{user.name}님의 리뷰</h3>
      {user.reviews.reviews.map((review) => (
        <ReviewCard key={review.id} review={review} showBook />
      ))}
    </Stack>
  );
}
