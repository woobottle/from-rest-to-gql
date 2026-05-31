# GraphQL로 책 리뷰 SNS 만들기

## 📋 과제 개요

- **학습 목표**
  - GraphQL이 REST의 어떤 통증을 해결하기 위해 만들어졌는지 **직접 측정**으로 체감해요.
  - 화면이 원하는 모양을 표현하는 **스키마**를 직접 설계해요.
  - Resolver 체인이 어떻게 동작하는지, **viewer 의존 필드(field-level authorization)**를 어떻게 표현하는지 손으로 익혀요.
  - Resolver 안에서 **N+1 문제**가 어떻게 발생하고 **DataLoader**가 어떻게 해결하는지 측정으로 확인해요.
  - GraphQL 클라이언트의 **정규화 캐시**가 무엇이고, **fragment colocation + codegen**이 왜 강력한지 이해해요.
  - Mutation 이후 **캐시 업데이트 전략**(refetch / 직접 수정 / optimistic) 차이를 손으로 익혀요.
- **기한**: 2주
- **결과물**: 동작하는 코드 (GitHub 레포)
- **기술 스택**: GraphQL Yoga(또는 Apollo Server), Fastify 5, Pothos(code-first) 또는 graphql-tools(schema-first), Apollo Client(또는 urql), GraphQL Code Generator, DataLoader, React 18, TypeScript, pnpm workspace

## 📖 배경 지식

각 항목의 질문에 답할 수 있을 정도면 충분해요. 감이 오지 않는 질문은 Step을 진행하면서 계속 고민해주세요.

### REST가 잘 못하는 것

- 한 화면이 N개의 endpoint를 부르고 그중 다수가 다른 응답에 의존할 때(=waterfall) 어떤 비용이 생기나요?
- "필요한 필드는 3개인데 응답이 30개 필드를 내려준다"가 누적되면 어떤 비용이 생기나요?
- 같은 데이터를 화면마다 다른 모양으로 원할 때 BE는 어떻게 대응하나요? (BFF / endpoint 추가 / 필드 셀렉터 쿼리 파라미터…)

### GraphQL 기초

- Query / Mutation / Subscription은 각각 뭔가요?
- 스키마, type, field, resolver는 어떻게 연결되어 있나요?
- **단일 endpoint에 POST**라는 게 무슨 뜻인가요? REST의 cache-friendliness를 어떻게 잃고 대신 무엇을 얻나요?
- **Operation, Variables, Fragment**가 각각 뭔가요?

### Resolver와 N+1

- 한 query 안에서 `Book.reviews` → `Review.author`를 따라갈 때 BE에서는 어떤 호출이 일어나나요?
- 왜 같은 type의 같은 필드에 대해 같은 ID를 여러 번 조회하는 패턴이 자주 생기나요?
- DataLoader가 **같은 tick 안의 ID들을 모아서 한 번에 조회**한다는 게 어떤 의미인가요?

### Field-level Authorization

- REST에서는 보통 "이 endpoint를 부를 수 있나"로 권한을 끊어요. GraphQL은 왜 **"이 필드를 볼 수 있나"** 단위로 권한을 결정해야 할까요?
- 같은 query 안에서 어떤 필드는 값이, 어떤 필드는 `null`이 내려오는 응답이 어떻게 가능한가요?
- 거부의 표현(`null` / `errors` 필드 / union payload)은 각각 어떤 트레이드오프가 있나요?

### 클라이언트 캐시와 Mutation

- Apollo Client의 `InMemoryCache`는 응답을 어떻게 **정규화**해서 저장하나요?
- 정규화의 전제(`__typename` + `id`)가 깨지면 어떤 일이 생기나요?
- Fragment colocation이 뭔가요? 왜 컴포넌트 옆에 fragment를 두는 게 좋은가요?
- Mutation 이후 캐시를 다시 맞추는 4가지 갈래(`refetchQueries` / `update` / `optimisticResponse` / 응답 포함)는 각각 어떤 상황에 자연스러운가요?

### 참고

- GraphQL 공식 문서: https://graphql.org/learn/
- GraphQL Yoga: https://the-guild.dev/graphql/yoga-server
- DataLoader: https://github.com/graphql/dataloader
- Apollo Client docs: https://www.apollographql.com/docs/react/
- GraphQL Code Generator: https://the-guild.dev/graphql/codegen

## 🏗️ 최종 아키텍처

```
┌───────────────────────────────────────────────┐
│         🖥️  Web (React + Apollo Client)        │
│         http://localhost:3000                  │
│  - 4개 화면(홈 피드 / 책 상세 / 유저 프로필    │
│    / 검색)                                     │
│  - Fragment colocation + codegen으로 타입 안전 │
│  - Mutation + 정규화 캐시 업데이트             │
└────────────────────┬──────────────────────────┘
                     │
            단일 POST /graphql
                     │
                     ▼
┌───────────────────────────────────────────────┐
│   🧩 GraphQL Server (Yoga, on Fastify)         │
│   http://localhost:4000/graphql                │
│  - 스키마 / resolver / DataLoader              │
│  - context: { viewer, loaders }                │
│    (viewer는 starter가 헤더에서 주입)          │
│  - field-level authorization                   │
└────────────────────┬──────────────────────────┘
                     │
                     ▼
┌───────────────────────────────────────────────┐
│   🔐 REST API (Fastify) — 제공됨               │
│   http://localhost:4100                        │
│   /books /reviews /users /me/likes ...         │
└───────────────────────────────────────────────┘
```

### 시나리오 — 책 리뷰 SNS

사용자가 책을 검색하고, 리뷰를 쓰고, 다른 사용자를 팔로우하면 그들의 리뷰가 홈 피드로 들어오는 미니 SNS예요.

| 앱      | 책임                                                               |
| ------- | ------------------------------------------------------------------ |
| **web** | 4개 화면(홈 피드 / 책 상세 / 유저 프로필 / 검색)을 그리는 React 앱 |
| **gql** | GraphQL 서버. REST를 감싸서 화면 친화적인 그래프로 제공            |
| **api** | REST 백엔드 — 제공됨. 더미 데이터 + JWT 인증                       |

### viewer / 권한 정책

- 로그인은 이 과제의 학습 대상이 아니에요. starter가 `apps/gql`의 context 빌더에서 **요청 헤더(`X-Viewer-Id`)를 보고 `viewer`를 주입**해줘요. 멘티는 `context.viewer`가 항상 있다고 가정하고 작업하세요.
- 작성자만 볼 수 있는 필드, admin만 볼 수 있는 필드 등 **field-level authorization**은 Step 2(설계) / Step 3(구현)에서 다뤄요.
- Mutation의 거부 표현은 Step 6에서 다뤄요.

## 📦 프로젝트 구조

```
gql-book-review/
├── apps/
│   ├── api/          # 🔐 REST 백엔드 — 완성된 코드
│   ├── gql/          # 🧩 GraphQL 서버 — 멘티가 만들어요 (context.viewer는 starter가 처리)
│   └── web/          # 🖥️  React + Apollo Client — 4개 화면 더미 데이터로 렌더링됨
├── packages/
│   └── shared-ui/    # Card, Button 같은 공통 컴포넌트
├── pnpm-workspace.yaml
└── package.json
```

### starter 상태

- `apps/api`는 **완성**되어 있어요. REST endpoint 목록은 아래 표 참고. 건드리지 마세요.
- `apps/gql`은 빈 Yoga 서버에 `hello: String` 한 줄과 **`context.viewer` 주입 코드**만 있어요. 스키마와 resolver를 멘티가 채워요.
- `apps/web`은 4개 화면 컴포넌트가 **더미 데이터로 이미 렌더링**되고 있어요. 데이터 패칭은 비어 있어요.

## 🚦 시작하기

```bash
pnpm install

# REST API 먼저
pnpm -F api dev

# 다른 터미널에서
pnpm -F gql dev
pnpm -F web dev
```

- `http://localhost:3000` (web)
- `http://localhost:4000/graphql` (gql, GraphiQL playground 포함)
- `http://localhost:4100` (api)

### REST 엔드포인트 (`apps/api`)

이 endpoint들이 Step 1에서 측정 대상이고, Step 3에서 resolver가 호출할 대상이에요.

| Method   | Path                              | 설명                                                           |
| -------- | --------------------------------- | -------------------------------------------------------------- |
| `POST`   | `/auth/login`                     | `{ username }` → JWT                                           |
| `GET`    | `/auth/me`                        | 현재 유저                                                      |
| `GET`    | `/books?sort=&category=&q=&page=` | 책 목록 (각 항목이 풀 객체)                                    |
| `GET`    | `/books/:id`                      | 책 1개 (description, ISBN, 출판사, 카테고리, 평균평점, 리뷰수) |
| `GET`    | `/books/:id/reviews?page=`        | 한 책의 리뷰 (작성자는 `authorId`만)                           |
| `GET`    | `/reviews/:id`                    | 리뷰 1개                                                       |
| `GET`    | `/reviews/:id/comments`           | 댓글                                                           |
| `POST`   | `/reviews`                        | 작성                                                           |
| `PATCH`  | `/reviews/:id`                    | 수정                                                           |
| `DELETE` | `/reviews/:id`                    | 삭제                                                           |
| `POST`   | `/reviews/:id/likes`              | 좋아요                                                         |
| `DELETE` | `/reviews/:id/likes`              | 좋아요 취소                                                    |
| `GET`    | `/users/:id`                      | 프로필 (bio, 가입일, 팔로워수, 리뷰수)                         |
| `GET`    | `/users/:id/reviews?page=`        | 그 유저가 쓴 리뷰                                              |
| `GET`    | `/users/:id/following`            | 팔로우하는 유저 ID 목록                                        |
| `POST`   | `/users/:id/follow`               | 팔로우                                                         |
| `DELETE` | `/users/:id/follow`               | 언팔로우                                                       |
| `GET`    | `/me/likes?reviewIds=`            | 내가 좋아요 한 리뷰 ID 목록                                    |
| `GET`    | `/me/follows?userIds=`            | 내가 팔로우 중인 유저 ID 목록                                  |

토큰 없이 호출하면 `401`, 권한 부족하면 `403`을 반환해요.

---

## ⭐ Step 1: REST의 통증을 측정하기

<aside>
💡 `step1/rest-baseline` 브랜치를 `main`에서 파서 진행해주세요.
</aside>

### 🎯 이 Step의 목적

이 Step의 학습 목표는 **UI를 잘 만드는 것이 아니라 REST의 통증을 손으로 느끼는 것**이에요. 그래서 화면 뼈대와 더미 데이터가 이미 그려진 상태로 starter가 제공돼요. 멘티는 그 더미를 진짜 REST 호출로 **교체**하면서, 그 과정에서 자연스럽게 `apps/api`의 endpoint 구조와 응답 모양을 익히는 게 핵심이에요.

### 📖 이해해야 할 내용

- **Over-fetching** — 응답에 들어 있지만 화면이 안 쓰는 필드의 비율.
- **Under-fetching** — 한 화면을 위해 여러 endpoint를 부르고, 그중 어떤 호출은 앞 호출의 결과(예: ID 목록)에 의존하는 상태. 의존 사슬의 깊이가 **waterfall**.
- **Client-side N+1** — 목록을 받은 뒤 각 항목의 상세를 또 하나씩 부르는 패턴.
- **"내 상태" 필드** — `likedByMe`, `followedByMe` 같은 viewer-derived 정보는 REST에서 어디에 두기 애매한가요?

### 📦 starter 상태

`apps/web`에는 4개 화면이 **더미 데이터로 이미 렌더링**되고 있어요.

- 각 페이지 컴포넌트(`HomeFeedPage`, `BookDetailPage`, `UserProfilePage`, `SearchPage`)는 화면이 표시하는 필드가 코드로 명시되어 있어요. **어떤 필드가 화면에 필요한지**가 한눈에 보일 거예요.
- 페이지 상단에 `// TODO: replace with real fetch` 주석이 달린 더미 데이터 블록이 있어요. 멘티는 이걸 진짜 호출로 교체해요.
- 공통 fetch 헬퍼는 `apps/web/src/lib/api.ts`에 비어 있는 채로 있어요. 여기에 base URL, JWT 헤더 첨부, JSON 파싱 정도만 채워 넣으면 충분해요.
- 스타일과 레이아웃은 절대 다듬지 마세요. 학습 포인트가 아니에요.

### 🔧 실습 내용

**1단계: API 구조 파악**

- `apps/api`의 endpoint 표를 한 번 훑고, `apps/api/src/routes/*`를 열어서 **실제 응답 모양**을 직접 확인하세요. (어떤 필드를 내려주는지, 관계 객체는 ID만 주는지 통째로 주는지)
- `curl` 또는 REST 클라이언트로 endpoint 5~6개를 직접 호출해보세요. 응답을 한 번이라도 눈으로 봐야 Step 2의 스키마 설계 감각이 잡혀요.

**2단계: 4개 화면의 더미 데이터를 REST 호출로 교체**

각 페이지에 표시될 데이터는 다음과 같아요. 이게 뭘 그리는지가 아니라, **어떤 필드를 화면이 필요로 하는지**에 주목하세요.

| 화면                                             | 표시 필드                                                                                                       | 필요한 응답                                                  |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **홈 피드** ("내가 팔로우한 사람들의 최근 리뷰") | 책 표지·제목 / 별점 / 리뷰 본문 일부 / 작성자 이름·아바타 / 좋아요 수 / 내가 좋아요 눌렀는지                    | 팔로우 ID → 각 유저의 리뷰 → 각 리뷰의 책·작성자 → 내 좋아요 |
| **책 상세**                                      | 책 표지·제목·평균평점(상단) / 설명(접힘) / 리뷰 목록(작성자 이름·아바타, 별점, 본문, 좋아요 수, 내 좋아요 여부) | 책 1개 + 책의 리뷰 + 각 리뷰의 작성자 + 내 좋아요            |
| **유저 프로필**                                  | 이름 / 아바타 / bio / 팔로워 수 / 내가 팔로우 중인지 / 그가 쓴 리뷰(각 리뷰의 책 표지·제목 포함)                | 유저 1개 + 그의 리뷰 + 각 리뷰의 책 + 내 팔로우              |
| **검색 자동완성**                                | 책 카드 5개 (`id`, `title`, `coverUrl`, `averageRating`)                                                        | `/books?q=`                                                  |

`useEffect` 안에서 `fetch`로 호출하는 것 정도면 충분해요. `react-query`나 `swr` 같은 건 일부러 쓰지 마세요. **호출 순서와 의존 관계가 코드에서 그대로 보여야** 통증 측정이 정직해져요.

**3단계: 측정**

각 화면을 한 번 그릴 때 다음을 측정해서 README에 표로 정리하세요. (DevTools Network 탭 + 네트워크 throttling은 "Fast 3G")

- 총 HTTP 호출 수
- waterfall 깊이 (의존 사슬의 최대 단계)
- 응답으로 받은 필드 중 **실제 화면에 쓰인 비율** — 적당히 추산해도 돼요 (응답 키 개수 / 화면이 읽는 키 개수)
- 가장 느린 단일 호출의 TTFB

### ✅ 완료 기준

- [ ] 4개 화면이 더미 데이터 없이 REST 호출만으로 동작
- [ ] `apps/api`의 endpoint를 직접 호출해본 흔적이 한 군데 이상 (README나 `curl` 스니펫)
- [ ] 각 화면별 측정표 (호출 수 / waterfall 깊이 / 사용 비율 / TTFB)
- [ ] 각 화면에 대해 **"GraphQL이면 무엇이 어떻게 달라질지" 한 문단** 가설을 본인 언어로 적기
- [ ] 가장 통증이 큰 화면 1개를 골라 이유를 명시

### ⚠️ 흔한 함정

- 스타일링은 필요없어요! 본질에 집중해주세요.
- `Promise.all`로 묶을 수 있는 호출까지 직렬로 부르면 waterfall이 과장돼요. **진짜로 의존이 있는 호출**(앞 응답의 ID가 있어야 다음을 부를 수 있음)과 **그냥 게으르게 직렬화한 호출**을 구분하세요.
- 더미 데이터를 지우지 않고 옆에 둔 채로 호출만 추가하면 측정이 거짓말이 돼요. 더미는 깔끔히 교체하세요.

---

## ⭐ Step 2: 스키마를 직접 설계하기

<aside>
💡 `step2/schema` 브랜치를 파서 진행해주세요.
</aside>

### 📖 이해해야 할 내용

- **타입 경계** — 어떤 개념을 type으로 둘지. 한 type이 다른 type을 field로 들고 있을 때의 의미.
- **Nullability** — 모든 필드는 기본 nullable이에요. non-null(`!`)을 붙이는 순간 어떤 약속을 BE에 강제하는 건가요?
- **viewer-derived field** — `Review.likedByMe`처럼 "현재 보고 있는 사람" 기준으로 값이 바뀌는 필드. 캐시·인증·결합도에 어떤 영향이 있나요?
- **Field-level authorization 설계** — 같은 type 안에 누구나 볼 수 있는 필드와 본인/admin만 볼 수 있는 필드가 섞일 때, 스키마에 어떻게 표현할지. 거부를 `null`로 내릴지 throw할지의 결정도 여기서 시작돼요.
- **페이지네이션 모양** — 단순 `[Review!]!` vs `Connection`(cursor 기반, Relay 스타일). 무한 스크롤이 필요한 곳은 어디인가요?
- **Mutation 입출력 패턴** — `input` 타입과 `payload` 타입을 분리하는 관습. 에러 표현 방식은 Step 6에서 본격적으로 다뤄요.
- **ID 설계** — `ID!`는 globally unique이 원칙. `Book:1`과 `User:1`의 충돌을 어떻게 막을지.

### 📦 starter가 가진 문제

- `apps/gql/src/schema.graphql`(또는 `schema.ts`)에 `type Query { hello: String }` 한 줄만 있어요.
- 멘티가 직접 채워 넣어야 해요.

### 🔧 실습 내용

**1단계: 화면 → 쿼리 역설계**

Step 1의 4개 화면 각각이 **딱 한 번의 query**로 그려질 수 있도록, 그 쿼리가 어떻게 생기면 좋을지 먼저 GraphiQL/문서에 적어보세요. 스키마를 그리기 전에 **소비자 입장**부터 잡는 게 핵심이에요.

예시(작성 전의 가상의 모양):

```graphql
query HomeFeed($cursor: String) {
  viewer {
    feed(after: $cursor, first: 20) {
      edges { node { ... } }
      pageInfo { ... }
    }
  }
}
```

**2단계: 스키마 작성**

위 쿼리가 모두 통하도록 스키마를 작성하세요. 다음 결정들을 README에 근거와 함께 남기세요.

- `Book`, `Review`, `User`, `Comment`의 type 경계와 관계 필드
- 어떤 필드를 non-null로 두었는지, 왜
- `likedByMe` / `followedByMe`를 어디에 두었는지 (`Review`/`User`에 직접? `Viewer` type 경유?)
- **viewer 의존 가시성** — `User.email`(본인만), `Review.draftContent`(작성자만), `Review.reportCount`(admin만) 같은 필드를 설계하고, 거부의 표현(`null` vs throw)을 결정
- 페이지네이션 모양 — Connection을 쓴 필드와 단순 list를 쓴 필드, 그 차이
- Mutation의 input/payload 모양
- `Node` 인터페이스(`id: ID!`)를 도입할지 — 도입하면 클라이언트 캐시 정규화에 어떤 이득이 있는지

**3단계: GraphiQL에서 4개 쿼리 검증**

스키마만 있고 resolver는 아직 비어 있어도, GraphiQL은 **introspection으로 자동완성**을 줘요. 4개 쿼리를 적어보면서 어색한 부분(필드명, 관계 방향, nullability)을 다듬으세요.

### ✅ 완료 기준

- [ ] 4개 화면 각각 **단일 query**로 그릴 수 있는 스키마
- [ ] 주요 설계 결정 6가지(타입 경계 / nullability / viewer-derived / viewer 가시성 / 페이지네이션 / Mutation 모양) 각각에 본인 언어로 근거
- [ ] `Node` 도입 여부와 그 이유
- [ ] 4개 query를 GraphiQL의 자동완성으로 막힘없이 적을 수 있음 (resolver는 아직 비어도 OK)

### ⚠️ 흔한 함정

- REST 응답을 그대로 type으로 옮기지 마세요. **화면이 원하는 모양**이 출발점이에요.
- 모든 필드를 non-null로 두면 BE에 강한 약속을 강요하게 돼요. viewer 가시성으로 가려야 하는 필드는 nullable로 두는 게 자연스러울 수 있어요.
- "수정도 같이"라는 이유로 `updateReview(review: Review!)` 같이 모델 type을 input으로 받지 마세요. input과 output type은 분리하는 게 관습이에요.

---

## ⭐ Step 3: Resolver 작성하기

<aside>
💡 `step3/resolvers` 브랜치를 파서 진행해주세요.
</aside>

### 📖 이해해야 할 내용

- **Resolver의 4-tuple** — `(parent, args, context, info)`. 각각이 뭔지.
- **Resolver chain** — `Query.book` → `Book.reviews` → `Review.author`로 따라갈 때, 각 단계가 독립적으로 resolve된다는 의미. 한 type의 한 필드를 그릴 때 어떤 resolver가 어떤 순서로 불리는지.
- **context** — starter가 `context.viewer`를 주입해줘요. resolver는 이걸 어떻게 활용해야 할까요?
- **Field-level authorization 구현** — 같은 query 안에서 어떤 필드는 값이, 어떤 필드는 `null`이 내려오는 응답이 어떻게 생기는지 직접 만들어보세요.

### 📦 starter 상태

- Step 2에서 짠 스키마는 그대로 있어요. resolver만 비어 있어요.
- `context.viewer`는 starter가 주입해줘요. 멘티는 그냥 `context.viewer.id`, `context.viewer.role`을 읽어 쓰면 돼요.
- **DataLoader는 이 Step에서는 도입하지 마세요.** Step 4에서 N+1을 측정한 다음에 들여놔요.

### 🔧 실습 내용

**1단계: naive resolver 작성**

각 type의 모든 필드에 대해 REST 호출로 resolver를 구현하세요. 의도적으로 **순진하게** 짜세요. `Review.author` resolver는 `GET /users/:id`를 그냥 부르면 됩니다.

**2단계: GraphiQL에서 4개 쿼리 동작 확인**

Step 2에서 그려둔 4개 쿼리를 GraphiQL에서 실행해서 응답이 잘 오는지 확인하세요. nullability나 관계 방향에 어색한 부분이 발견되면 Step 2 스키마를 다듬어도 됩니다.

**3단계: Field-level authorization 구현**

Step 2에서 설계한 viewer 의존 필드를 구현하세요. 예시:

```ts
const resolvers = {
  User: {
    email: (parent, args, context) => {
      if (context.viewer?.id === parent.id) return parent.email;
      return null;
    },
  },
  Review: {
    draftContent: (parent, args, context) => {
      if (context.viewer?.id === parent.authorId) return parent.draftContent;
      return null;
    },
    reportCount: (parent, args, context) => {
      if (context.viewer?.role === "admin") return parent.reportCount;
      return null;
    },
  },
};
```

- `X-Viewer-Id` 헤더를 다른 값으로 바꿔서 GraphiQL을 호출해보세요. 같은 query인데 응답이 달라지는 걸 직접 보세요.
- 거부 표현을 `null`로 갈지, throw해서 `errors`에 띄울지 본인이 결정하고 README에 근거를 남기세요.

**4단계: REST 호출 수 관찰 (Step 4의 빌드업)**

홈 피드 쿼리를 한 번 실행하고 `apps/api` 로그를 보면 REST 호출이 꽤 많이 나갈 거예요. **세지는 마세요.** Step 4에서 정식으로 측정하고 고칠 거예요. "음, 호출이 좀 많네"만 인식하고 넘어가요.

### ✅ 완료 기준

- [ ] Step 2 스키마의 모든 필드가 resolve됨
- [ ] GraphiQL에서 4개 화면 쿼리가 모두 동작 (응답 형태 확인)
- [ ] viewer 의존 필드(최소 2개) 구현 — `X-Viewer-Id`를 바꿔서 응답 차이 직접 확인
- [ ] viewer 의존 필드의 거부 표현(`null` vs throw) 선택과 근거를 README에 남김

### ⚠️ 흔한 함정

- N+1을 미리 `Promise.all`로 묶지 마세요. Step 4에서 측정 → 해결의 흐름을 망쳐요.
- viewer 검증을 매 resolver마다 if문으로 흩뿌리면 누락이 생겨요. 헬퍼(`requireSelf(parent, context)`, `requireAdmin(context)`)로 묶어두는 게 안전해요.
- `context.viewer`가 없는 케이스(로그아웃 상태)도 고려하세요. starter가 viewer를 못 만들면 `context.viewer === null`이에요.

---

## ⭐ Step 4: N+1을 측정하고 DataLoader로 해결하기

<aside>
💡 `step4/dataloader` 브랜치를 파서 진행해주세요.
</aside>

### 📖 이해해야 할 내용

- **Client-side N+1이 server-side N+1로 옮겨오는 순간** — Step 1에서 클라이언트가 직접 N번 호출하던 패턴이, Step 3의 naive resolver에서는 BFF가 N번 호출하는 패턴으로 그대로 옮겨와요. 클라이언트의 통증은 사라졌지만 시스템 전체의 호출 수는 줄지 않았어요.
- **DataLoader의 핵심** — 같은 tick 동안 들어온 key들을 모아서 **batch 함수 한 번**으로 처리. 같은 key가 반복되면 자동으로 중복 제거(deduplication)도 해줘요.
- **request-scoped여야 하는 이유** — DataLoader는 한 요청 내에서만 살아야 해요. 모듈 top-level에 두면 요청 사이에 데이터가 새서 인증/권한 사고가 생겨요.
- **REST 위에서의 batching의 한계** — REST에 batch endpoint(`/users?ids=...`)가 있어야 진짜 호출 절감이 있어요. 없으면 DataLoader는 중복 제거와 캐시(요청 내) 이득만 줘요. `apps/api`에는 **의도적으로 일부 batch endpoint만** 제공돼요.

### 📦 starter 상태

- Step 3의 naive resolver가 그대로 있어요.
- `apps/api`에는 batch endpoint가 일부만 있어요:
  - `GET /me/likes?reviewIds=...` ✅ batch
  - `GET /me/follows?userIds=...` ✅ batch
  - `GET /users/:id` ❌ 단건만
  - `GET /books/:id` ❌ 단건만

### 🔧 실습 내용

**1단계: N+1 재현 + 측정**

- Step 3의 resolver 그대로 GraphiQL에서 홈 피드 query 실행
- `apps/api`의 로그를 캡처해서 **어떤 endpoint가 몇 번 호출됐는지** 표로 정리
  - 예상: `/users/:id` × N번, `/books/:id` × M번, `/me/likes` × 1번
- 책 상세, 유저 프로필 쿼리도 같은 방식으로 측정
- README에 "Before" 측정표

**2단계: DataLoader 도입**

- `userLoader`, `bookLoader` 등을 만들고 **요청마다 새로 생성**해서 context에 주입
- batch 함수는 한 번에 들어온 ID 배열로 `apps/api`를 호출
- batch endpoint가 없는 경우(`/users/:id` 등)는 batch 함수 안에서 `Promise.all`로 N번 호출. **이 경우에도 같은 ID 중복 호출은 사라져요.**

**3단계: After 측정**

- 같은 쿼리를 다시 실행하고 `apps/api` 로그로 호출 수 측정
- README에 Before / After 표 비교
- "batch endpoint가 있는 곳"과 "없는 곳"에서 절감 효과가 어떻게 다른지 한 단락 정리

**4단계: request-scope 검증**

- DataLoader를 일부러 **모듈 top-level**에 만들어보고, 두 명의 viewer로 연속 호출 → 두 번째 viewer가 첫 번째 viewer 데이터를 보는 사고를 재현해보세요
- 다시 request-scoped로 되돌리고, 같은 시나리오에서 데이터 누수가 사라지는지 확인
- README에 "DataLoader는 왜 request-scoped여야 하는가"를 본인 언어로 한 단락

### ✅ 완료 기준

- [ ] DataLoader 도입 전/후 REST 호출 수 비교표 (3개 화면 쿼리 각각)
- [ ] DataLoader가 **request-scoped**로 생성되는 것을 코드로 보장
- [ ] batch endpoint가 있는 곳과 없는 곳에서 DataLoader의 이득이 어떻게 다른지 한 단락 정리
- [ ] request-scoped가 깨졌을 때의 사고 시나리오를 한 번 직접 재현

### ⚠️ 흔한 함정

- DataLoader를 모듈 top-level에 두면 **요청 간 데이터 누설**이 생겨요. 인증/권한 사고로 직결돼요.
- batch 함수의 **반환 배열 순서는 입력 key 배열 순서와 일치**해야 해요. ID 누락이 있으면 `null`을 채워야 해요.
- "DataLoader는 만능 캐시"라고 생각하지 마세요. 요청이 끝나면 사라져요. 요청 간 캐시는 별도 레이어가 필요해요(이 과제 범위 밖).

---

## ⭐ Step 5: 클라이언트 — Fragment colocation, codegen, 정규화 캐시

<aside>
💡 `step5/client` 브랜치를 파서 진행해주세요.
</aside>

### 📖 이해해야 할 내용

- **Fragment colocation** — 각 컴포넌트가 자기가 쓰는 데이터를 fragment로 선언. 페이지의 query는 fragment들을 조립.
- **GraphQL Code Generator** — 스키마와 operation을 읽어서 TypeScript 타입과 hook(`useHomeFeedQuery`)을 생성. 응답 타입이 컴파일 타임에 보장돼요.
- **InMemoryCache의 정규화** — `__typename + id`를 키로 객체를 평탄화해서 저장. `Review:42`를 어디서 봤든 같은 객체로 인식.
- **정규화가 깨지는 순간** — `id`가 없거나 `__typename`이 같은 두 entity가 같은 id를 가지면(예: `User:1`과 `Book:1`) 캐시가 이상해져요. Step 2의 `Node` 결정과 연결돼요.
- **Step 1 측정의 재반복** — 같은 화면을 GraphQL로 그렸을 때, 클라이언트 입장에서 호출 수와 waterfall이 실제로 어떻게 줄었는지.

### 📦 starter 상태

- `apps/web`은 Step 1에서 REST 호출로 채워둔 상태예요. 이걸 GraphQL로 갈아끼우는 게 이 Step의 작업이에요.
- 페이지 컴포넌트와 자식 컴포넌트(`ReviewCard`, `UserAvatar` 등)는 그대로 둬요. 데이터 패칭 경로만 GraphQL로 교체해요.

### 🔧 실습 내용

**1단계: Apollo Client 셋업 + codegen**

- `apps/web`에 Apollo Client 설치, `ApolloProvider`로 감싸기
- HTTP link에서 `X-Viewer-Id` 헤더를 첨부 (인증은 학습 대상이 아니라서 헤더 한 줄로 끝)
- GraphQL Code Generator 설정 (`client preset` 권장)
- 빌드 시 `.graphql` 파일이나 `gql` 태그가 스캔되어 타입이 생성되는지 확인

**2단계: Fragment colocation으로 화면 만들기**

- `ReviewCard` 컴포넌트가 `ReviewCard_review` fragment를 선언
- `UserAvatar` 컴포넌트가 `UserAvatar_user` fragment를 선언
- 홈 피드 페이지의 query는 위 fragment들을 조립
- 4개 화면 모두 이렇게 구성

**3단계: 정규화 캐시 관찰**

- Apollo DevTools 또는 `cache.extract()`로 캐시 내용 출력
- 같은 `User:42`가 홈 피드와 책 상세 양쪽에서 한 객체로 저장되는지
- `__typename`이나 `id`를 일부러 빼서 깨뜨리고 어떤 일이 일어나는지 관찰

**4단계: Step 1과 다시 비교**

- 같은 4개 화면에 대해 호출 수, waterfall 깊이, 사용 비율을 다시 측정해서 README에 표 추가
- 정직하게 — **어떤 항목은 별로 안 바뀌는지**도 함께 정리

### ✅ 완료 기준

- [ ] 4개 화면 모두 단일 query + fragment colocation으로 구성
- [ ] codegen이 동작해서 hook과 응답 타입이 자동 생성
- [ ] 정규화 캐시 동작 확인 (`cache.extract()` 스냅샷 1장 첨부)
- [ ] Step 1 ↔ Step 5 측정 비교표 (호출 수 / waterfall / 사용 비율)
- [ ] 정규화가 깨졌을 때의 증상을 한 케이스라도 직접 재현

### ⚠️ 흔한 함정

- fragment 안에서 다시 fragment를 쓸 때 spread를 빼먹으면 codegen이 빈 타입을 만들어줘요.
- `id`가 string인지 number인지 헷갈리면 캐시 키가 갈라져요. 스키마와 응답 모양을 강하게 통일하세요.
- 같은 query를 여러 컴포넌트에서 직접 부르지 마세요. 페이지가 query를 들고, 자식은 fragment만 쓰는 게 colocation의 핵심이에요.

---

## ⭐ Step 6: Mutation과 캐시 업데이트

<aside>
💡 `step6/mutation` 브랜치를 파서 진행해주세요.
</aside>

### 📖 이해해야 할 내용

- **Mutation의 캐시 업데이트 4가지 갈래**
  - `refetchQueries` — mutation 후 영향받은 query를 다시 호출. 간단하지만 네트워크 비용
  - `update` 함수 — 캐시를 직접 수정. 가장 정교하지만 손이 가요
  - `optimisticResponse` — 서버 응답을 기다리지 않고 UI 먼저 갱신. 실패 시 자동 롤백
  - **응답에 갱신될 entity 통째 포함** — mutation 응답에 갱신된 객체 전체를 담아 정규화 캐시가 자동으로 머지
- 각각 어떤 상황에 자연스러운지가 학습 포인트.
- **Mutation 거부 표현** — Step 2/3의 query 쪽 viewer 가시성과는 다른 결정이에요.
  - throw → `errors` 필드
  - union payload — `DeleteReviewResult = DeleteReviewSuccess | Forbidden | NotFound`
  - 각각 클라이언트 코드가 어떻게 달라지는지

### 📦 starter 상태

- Step 5의 클라이언트가 그대로 있어요. 쿼리는 다 동작해요.
- mutation resolver는 비어 있어요. 멘티가 작성해요.

### 🔧 실습 내용

**1단계: Mutation resolver 작성**

다음 mutation들을 `apps/gql`에 구현하세요. 각 mutation은 내부에서 `apps/api`의 REST를 호출.

- 리뷰 작성 / 수정 / 삭제
- 좋아요 토글 (별도 mutation 2개 또는 하나로)
- 팔로우 토글

**2단계: 거부 표현 결정**

- `Mutation.deleteReview`는 본인 리뷰 또는 admin만 가능. 다른 사람이 시도하면?
- throw / union payload 중 한 방식을 골라 구현하고 README에 근거 남기기
- 다른 mutation들도 같은 정책을 따르도록 일관성 유지

**3단계: 클라이언트 — 캐시 업데이트 4가지 직접 시도**

같은 좋아요 토글을 4가지 방식으로 구현해보고, 각 방식에서 다음을 측정:

| 방식                             | 네트워크 호출 수 | UI 반응 속도 | 코드 양 | 실패 시 동작 |
| -------------------------------- | ---------------- | ------------ | ------- | ------------ |
| `refetchQueries`                 |                  |              |         |              |
| `update` 함수                    |                  |              |         |              |
| `optimisticResponse` + `update`  |                  |              |         |              |
| mutation 응답에 갱신 entity 포함 |                  |              |         |              |

- 표를 README에 채우고, 좋아요 토글에 본인이 최종 선택한 방식과 근거를 적기

**4단계: 다른 mutation에 적용**

- 리뷰 작성 → 홈 피드 / 책 상세의 리뷰 목록이 자동 갱신
- 리뷰 삭제 → 위 목록에서 자동 사라짐
- 각각 어떤 캐시 업데이트 방식을 골랐고 왜 그랬는지 README에 한 줄씩

### ✅ 완료 기준

- [ ] 5종 mutation 동작 (리뷰 CRUD / 좋아요 / 팔로우)
- [ ] 좋아요 토글에 대해 4가지 캐시 업데이트 방식을 모두 구현 후 비교표
- [ ] Mutation 거부의 표현 방식(throw / union)을 본인이 정하고 근거 명시
- [ ] 리뷰 작성/삭제 후 관련 화면이 새로고침 없이 자동 갱신

### ⚠️ 흔한 함정

- optimistic response 모양이 실제 응답과 다르면 토글이 깜빡거려요. `__typename`과 `id`를 빠뜨리지 마세요.
- 모든 mutation을 `refetchQueries`로 처리하면 편하지만 네트워크가 늘어요. 캐시 직접 갱신이 더 빠른 경우가 많아요.
- mutation 응답에 갱신될 entity를 통째로 담는 방식은 가장 우아하지만, **응답 모양이 크면** 비용이 늘어요. 작은 entity일 때 강력함.

---

## 🎓 과제 완료 후 생각해볼 질문

### 1. GraphQL의 값어치

- Step 1과 Step 5의 측정표를 비교했을 때, **실제로 줄어든 것**과 **별로 안 줄어든 것**은 각각 무엇이었나요?
- 어떤 화면에서는 REST가 더 단순했을 수도 있어요. 어떤 화면인가요? 왜인가요?
- "BFF로 REST 호출을 묶기"만으로도 Step 1의 통증 다수가 해결돼요. 그래도 GraphQL을 쓰는 게 더 나은 지점은 어디인가요?

### 2. 스키마의 책임

- viewer-derived field(`likedByMe`)를 `Review` 직접에 둔 선택과 `Viewer` 경유의 선택, 본인은 어디로 갔고 다시 한다면 어떻게 갈 건가요?
- non-null을 빡세게 둔 선택이 어디서 후회가 됐나요?
- viewer 의존 필드의 거부 표현으로 `null`을 골랐다면, 클라이언트는 "권한 없음"과 "실제 값이 없음"을 어떻게 구분하나요?

### 3. 캐시의 신뢰

- 정규화 캐시가 깨지는 경우를 1개 더 상상해서 적어보세요.
- 두 화면이 같은 entity를 다르게 캐시하면 어떤 사용자 경험 문제가 생기나요?
- 캐시를 **신뢰하지 못하는** 데이터는 어떤 종류인가요? (예: 평균평점)
- Step 6의 4가지 캐시 업데이트 방식 중, 본인은 어떤 상황에 어떤 걸 기본값으로 쓸 건가요?

### 4. 운영 관점

- GraphQL의 단일 endpoint가 REST의 endpoint별 캐시(CDN)를 잃는다는 게 운영에 어떤 비용인가요?
- query 비용 폭발(`books { reviews { author { followers { followers { ... } } } } }`)을 어떻게 막을 건가요?
- 클라이언트가 자유롭게 query를 짤 수 있다는 게 백엔드 운영에 어떤 리스크인가요? (persisted queries 같은 개념)

---

## 🔗 한 번 더 볼 만한 링크

- [GraphQL Learn](https://graphql.org/learn/)
- [Production Ready GraphQL — schema design](https://book.productionreadygraphql.com/)
- [DataLoader (graphql/dataloader)](https://github.com/graphql/dataloader)
- [Apollo Client — Caching](https://www.apollographql.com/docs/react/caching/overview/)
- [Apollo Client — Mutations](https://www.apollographql.com/docs/react/data/mutations/)
- [GraphQL Code Generator — client preset](https://the-guild.dev/graphql/codegen/docs/guides/react-vue)
- [Relay Cursor Connections Specification](https://relay.dev/graphql/connections.htm)

수고하셨어요!
