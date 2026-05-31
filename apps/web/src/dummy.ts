// 더미 데이터 — Step 1에서 멘티가 진짜 REST 호출로 교체할 대상이에요.
// 각 페이지 컴포넌트가 어떤 필드를 화면에 표시하는지 명확히 보여주려고 둔 것이고,
// 화면 동작 자체를 미리 보여주는 역할도 해요.

export type DummyUser = {
  id: string;
  name: string;
  avatarUrl: string;
  bio: string;
  followerCount: number;
  followingCount: number;
  reviewCount: number;
};

export type DummyBook = {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  description: string;
  averageRating: number;
  reviewCount: number;
};

export type DummyReview = {
  id: string;
  rating: number;
  content: string;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
  book: { id: string; title: string; coverUrl: string };
  author: { id: string; name: string; avatarUrl: string };
};

const dummyUser = (id: string, name: string, idx: number): DummyUser => ({
  id,
  name,
  avatarUrl: `https://i.pravatar.cc/100?img=${idx}`,
  bio: `${name}의 소개글`,
  followerCount: 12,
  followingCount: 7,
  reviewCount: 3,
});

const dummyBook = (id: string, title: string, author: string, seed: string): DummyBook => ({
  id,
  title,
  author,
  coverUrl: `https://picsum.photos/seed/${seed}/200/300`,
  description: "더미 책 설명입니다. 실제 데이터로 교체될 자리예요.",
  averageRating: 4.3,
  reviewCount: 4,
});

const dummyReview = (
  id: string,
  rating: number,
  content: string,
  book: DummyBook,
  author: DummyUser,
): DummyReview => ({
  id,
  rating,
  content,
  likeCount: 7,
  likedByMe: false,
  createdAt: "2026-05-20T10:00:00Z",
  book: { id: book.id, title: book.title, coverUrl: book.coverUrl },
  author: { id: author.id, name: author.name, avatarUrl: author.avatarUrl },
});

const u1 = dummyUser("u1", "시현", 1);
const u2 = dummyUser("u2", "지원", 2);
const u3 = dummyUser("u3", "수민", 3);
const u4 = dummyUser("u4", "도윤", 4);

const b1 = dummyBook("b1", "달과 6펜스", "서머싯 몸", "b1");
const b2 = dummyBook("b2", "사피엔스", "유발 하라리", "b2");
const b3 = dummyBook("b3", "도둑맞은 집중력", "요한 하리", "b3");
const b4 = dummyBook("b4", "코스모스", "칼 세이건", "b4");

export const dummyFeed: DummyReview[] = [
  dummyReview("r5", 5, "역사책이 이렇게 재미있을 수 있다니. 인지혁명 챕터가 백미.", b2, u2),
  dummyReview("r10", 4, "스마트폰 사용 시간을 줄여야겠다는 다짐만 다섯 번째.", b3, u3),
  dummyReview("r13", 5, "한 챕터씩 천천히 읽었다. 우주 앞에 겸손해진다.", b4, u3),
  dummyReview("r18", 5, "마지막 장 덮을 때 울었다.", b1, u4),
];

export const dummyBookDetail = {
  book: b1,
  reviews: [
    dummyReview("r1", 5, "예술혼이라는 게 이렇게 무서운 거였구나.", b1, u1),
    dummyReview("r2", 4, "스트릭랜드가 미친 사람인지 천재인지 끝까지 모르겠다.", b1, u3),
  ],
};

export const dummyProfile = {
  user: u3,
  followedByMe: false,
  reviews: [
    dummyReview("r10", 4, "스마트폰 사용 시간을 줄여야겠다는 다짐만 다섯 번째.", b3, u3),
    dummyReview("r19", 4, "히가시노 게이고가 이런 따뜻한 글도 쓰는구나.", b1, u3),
  ],
};

export const dummySearchResults: DummyBook[] = [b1, b2, b3, b4];
