import { graphql } from "../gql";

export const HomeFeedQuery = graphql(`
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

export const BookDetailQuery = graphql(`
  query BookDetail($id: ID!, $cursor: String) {
    book(id: $id) {
      id
      title
      author
      coverUrl
      averageRating
      reviewCount
      description
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

