import { Stack } from "@gql-book-review/shared-ui";
import { FragmentType, graphql, useFragment } from "../gql";

// 이 컴포넌트가 그리는 데 필요한 필드 = fragment. 컴포넌트와 같은 파일에 선언(colocation).
// "아바타 + 이름"을 쓰는 곳이라면 어디서든 이 fragment 하나만 spread 하면 돼요.
export const UserAvatar_user = graphql(`
  fragment UserAvatar_user on User {
    id
    name
    avatarUrl
  }
`);

type Props = {
  user: FragmentType<typeof UserAvatar_user>;
  size?: number;
};

export function UserAvatar({ user: raw_user, size = 24 }: Props) {
  // unmask: 여기서부터 fragment에 선언한 필드만 타입 안전하게 접근.
  const user = useFragment(UserAvatar_user, raw_user);

  return (
    <Stack direction="row" gap={8} align="center">
      <img
        src={user.avatarUrl ?? undefined}
        alt=""
        width={size}
        height={size}
        style={{ borderRadius: 9999 }}
      />
      <span style={{ fontWeight: 600 }}>{user.name}</span>
    </Stack>
  );
}
