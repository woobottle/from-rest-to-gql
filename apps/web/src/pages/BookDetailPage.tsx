import { useMutation, useQuery } from "@apollo/client";
import { Button, Card, Stack } from "@gql-book-review/shared-ui";
import { useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { ReviewCard } from "../components/ReviewCard";
import { graphql } from "../gql";
import { BookDetailQuery, HomeFeedQuery } from "../operations/queries";

const CreateReviewMutation = graphql(`
  mutation CreateReview($input: CreateReviewInput!) {
    createReview(input: $input) {
      __typename
      ... on MutationError {
        message
      }
    }
  }
`);

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [expanded, setExpanded] = useState(false);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [createFeedback, setCreateFeedback] = useState<string | null>(null);
  const { data, loading, error } = useQuery(BookDetailQuery, {
    variables: { id: id! },
    skip: !id,
  });
  const [createReview, { loading: creating }] = useMutation(
    CreateReviewMutation,
  );

  async function handleCreateReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id || content.trim() === "") return;
    setCreateFeedback(null);

    try {
      const result = await createReview({
        variables: {
          input: {
            bookId: id,
            rating,
            content: content.trim(),
          },
        },
        refetchQueries: [
          { query: BookDetailQuery, variables: { id } },
          { query: HomeFeedQuery },
        ],
        awaitRefetchQueries: true,
      });
      const payload = result.data?.createReview;
      if (payload?.__typename !== "ReviewSuccess") {
        setCreateFeedback(payload?.message ?? "리뷰 작성에 실패했습니다.");
        return;
      }

      setContent("");
      setCreateFeedback("리뷰를 작성하고 관련 목록을 다시 조회했습니다.");
    } catch (mutationError) {
      setCreateFeedback(
        mutationError instanceof Error
          ? mutationError.message
          : "리뷰 작성에 실패했습니다.",
      );
    }
  }

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

      <Card>
        <form onSubmit={handleCreateReview}>
          <Stack gap={12}>
            <h3 style={{ margin: 0 }}>리뷰 작성</h3>
            <label>
              별점{" "}
              <select
                value={rating}
                onChange={(event) => setRating(Number(event.target.value))}
                disabled={creating}
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="리뷰를 입력하세요"
              rows={4}
              required
              disabled={creating}
              style={{ padding: 8, resize: "vertical" }}
            />
            <Button
              type="submit"
              disabled={creating || content.trim() === ""}
              style={{ alignSelf: "flex-start" }}
            >
              {creating ? "작성 후 목록 갱신 중…" : "리뷰 작성"}
            </Button>
            {createFeedback && (
              <span style={{ color: "#6b7280", fontSize: 12 }}>
                {createFeedback}
              </span>
            )}
          </Stack>
        </form>
      </Card>

      <h3 style={{ margin: "16px 0 0" }}>리뷰 {book.reviewCount}개</h3>
      {book.reviews.reviews.map((review) => (
        // 책 상세에서는 이미 어떤 책인지 알기 때문에 표지 중복 표시는 생략(showBook=false).
        <ReviewCard key={review.id} review={review} />
      ))}
    </Stack>
  );
}
