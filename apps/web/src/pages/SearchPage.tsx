import { useQuery } from "@apollo/client";
import { Stack } from "@gql-book-review/shared-ui";
import { useState } from "react";
import { BookCard } from "../components/BookCard";
import { graphql } from "../gql";

const SearchQuery = graphql(`
  query Search($q: String!) {
    search(query: $q, first: 5) {
      books {
        id
        ...BookCard_book
      }
      nextCursor
    }
  }
`);

export function SearchPage() {
  const [q, setQ] = useState("");
  const { data, loading } = useQuery(SearchQuery, {
    variables: { q },
    skip: q.trim() === "",
  });

  return (
    <Stack gap={16}>
      <h2 style={{ margin: 0 }}>검색</h2>
      <input
        placeholder="책 제목이나 저자로 검색"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ padding: "8px 12px", maxWidth: 400 }}
      />
      <Stack direction="row" gap={12}>
        {data?.search?.books?.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </Stack>
    </Stack>
  );
}
