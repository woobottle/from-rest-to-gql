export type Role = "user" | "admin";

export type User = {
  id: string;
  name: string;
  avatarUrl: string;
  bio: string;
  email: string;
  joinedAt: string;
  role: Role;
  // 운영 필드 (admin만 봐야 하는 정보)
  bannedAt: string | null;
};

export type Book = {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  description: string;
  isbn: string;
  publishedAt: string;
  publisher: string;
  category: string;
  pageCount: number;
  // 집계
  averageRating: number;
  reviewCount: number;
};

export type Review = {
  id: string;
  bookId: string;
  authorId: string;
  rating: number; // 1~5
  content: string;
  // 작성자만 볼 수 있는 임시 본문
  draftContent: string | null;
  // 운영용 (admin만)
  reportCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type Comment = {
  id: string;
  reviewId: string;
  authorId: string;
  content: string;
  createdAt: string;
};
