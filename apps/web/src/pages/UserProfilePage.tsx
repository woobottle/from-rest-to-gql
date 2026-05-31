import { Card, Stack } from "@gql-book-review/shared-ui";
import { ReviewCard } from "../components/ReviewCard";
import { dummyProfile } from "../dummy";

// ─────────────────────────────────────────────────────────────
// Step 1에서 채워 넣을 자리:
//   - 아래 `data`를 REST 호출 결과로 교체하세요.
//   - 화면이 필요로 하는 데이터: 이름 / 아바타 / bio / 팔로워 수 / 내가 팔로우 중인지
//     + 그가 쓴 리뷰 목록(각 리뷰의 책 표지·제목 포함)
//
// 힌트:
//   1) GET /users/:id → 프로필
//   2) GET /users/:id/reviews → 그가 쓴 리뷰 목록
//   3) 각 리뷰의 책 정보 → GET /books/:id × N (waterfall + N+1)
//   4) GET /me/follows?userIds=:id → 내가 팔로우 중인가
// ─────────────────────────────────────────────────────────────

export function UserProfilePage() {
  // TODO: replace dummy data with real fetch
  const { user, followedByMe, reviews } = dummyProfile;

  return (
    <Stack gap={16}>
      <Card>
        <Stack direction="row" gap={16} align="center">
          <img
            src={user.avatarUrl}
            alt=""
            width={80}
            height={80}
            style={{ borderRadius: 9999 }}
          />
          <Stack gap={4}>
            <h2 style={{ margin: 0 }}>{user.name}</h2>
            <span style={{ color: "#6b7280" }}>{user.bio}</span>
            <span>
              팔로워 {user.followerCount} · 팔로잉 {user.followingCount} · 리뷰 {user.reviewCount}
            </span>
            <button style={{ marginTop: 8, alignSelf: "flex-start" }}>
              {followedByMe ? "팔로잉" : "팔로우"}
            </button>
          </Stack>
        </Stack>
      </Card>

      <h3 style={{ margin: "16px 0 0" }}>{user.name}님의 리뷰</h3>
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} showBook />
      ))}
    </Stack>
  );
}
