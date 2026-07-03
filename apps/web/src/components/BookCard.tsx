import { Card, Stack } from "@gql-book-review/shared-ui";
import { FragmentType, graphql, useFragment } from "../gql";

export const BookCard_book = graphql(`
  fragment BookCard_book on Book {
    id
    title
    coverUrl
    averageRating
  }
`)

type Props = {
  book: FragmentType<typeof BookCard_book>;
};

// 이 카드가 표시하는 필드: 책 표지, 제목, 평균 별점만
// (검색 자동완성 / 인기책 캐러셀에서 사용)
export function BookCard({ book: raw_book }: Props) {
  const book = useFragment(BookCard_book, raw_book);

  return (
    <Card style={{ padding: 12, width: 160 }}>
      <Stack gap={8}>
        <img src={book.coverUrl ?? ''} alt="" width={140} height={210} />
        <strong style={{ fontSize: 14 }}>{book.title}</strong>
        <span style={{ fontSize: 12, color: "#6b7280" }}>★ {book.averageRating.toFixed(1)}</span>
      </Stack>
    </Card>
  );
}
