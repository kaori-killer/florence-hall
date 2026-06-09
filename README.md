# Florence Hall

공연 좌석 예매 사이트. 데이터베이스 과목 과제로 만들었다.

같은 좌석을 거의 같은 시간에 두 사람이 누르면 어떻게 되는가? 이걸 시연해보고 싶어서 도메인을 좌석 예매로 잡았다. PostgreSQL 트랜잭션과 partial UNIQUE 인덱스로 한 명만 성공하게 만들고, 통합 테스트로 진짜 그렇게 동작하는지 매번 확인한다.

## 왜 좌석 예매 도메인?

과제 평가 항목이 *릴레이션 · 쿼리 · 트랜잭션* 셋이었는데, 이 셋이 모두 자연스럽게 등장하는 가장 단순한 도메인이 좌석 예매라고 생각했다.

특히 트랜잭션은 *없으면 어떻게 깨지는지* 시연이 직관적인 게 좌석 예매다. "두 명이 동시에 같은 좌석을 누르면?" 이라는 시나리오가 일상적이라.

## 기술 스택

- **Next.js 16** (App Router) · React 19 · TypeScript
- **PostgreSQL 16**
- DB는 `pg` 드라이버로 직접 — **ORM은 안 썼다.** 평가 항목이 "쿼리·트랜잭션을 어떻게 정의했는지"라서 ORM이 SQL을 가리면 어필이 안 된다.
- 인증은 `bcryptjs` + HMAC-SHA256 쿠키 세션 (NextAuth 없이 직접)
- 테스트는 Vitest(도메인 통합) + Playwright(E2E)
- 성능 측정은 강의에서 배운 `pgbench`
- 스타일은 Tailwind v4 (토스 톤 컬러 토큰)

별도 백엔드 프로세스는 두지 않았다. Next.js 16의 Server Actions로 풀스택을 한 프로젝트 안에서 다 했다.

## 데이터 모델

테이블 3개: `users`, `performances`, `bookings`.

좌석을 별도 테이블로 두지 않고 `bookings` 행에 (`section`, `row_label`, `seat_number`)로 직접 박았다. 모든 공연이 같은 좌석 배치(A·B 섹션 × 3행 × 5번 = 30석)라는 가정이라 별도 좌석 마스터 테이블 없이 코드 상수(`src/lib/venue.ts`)로 충분하다.

처음엔 5개 테이블(`users`, `performances`, `seats`, `bookings`, `booking_seats`)로 시작했는데, junction table까지 두니 발표할 때 "각 테이블이 왜 있는지" 설명이 길어졌다. 3개로 줄이니 한 줄로 정리된다.

핵심은 이 인덱스 하나다.

```sql
CREATE UNIQUE INDEX uniq_confirmed_seat
  ON bookings (performance_id, section, row_label, seat_number)
  WHERE status = 'CONFIRMED';
```

활성 예매에만 적용되는 partial UNIQUE. 취소된 행은 `status = 'CANCELLED'` 가 되면서 인덱스에서 자동으로 빠지고, 같은 좌석을 다시 잡을 수 있게 된다. 한 줄로 "한 좌석 = 한 사람, 취소 시 풀림" 규칙을 표현한 셈.

## 예매 트랜잭션

`src/domain/bookings.ts`. 좌석 잠금 → 충돌 검사 → 그룹 ID 발급 → 다중 행 INSERT 를 한 트랜잭션 안에서 처리한다.

```sql
BEGIN;

-- 가격 조회
SELECT price FROM performances WHERE id = $1;

-- 같은 공연의 활성 예매 행을 잠근다
SELECT section, row_label, seat_number
  FROM bookings
 WHERE performance_id = $1 AND status = 'CONFIRMED'
 FOR UPDATE;
-- 선택한 좌석 중 이미 잡힌 게 있으면 ROLLBACK

-- 묶음 ID 발급 (한 번에 여러 좌석을 예매하면 같은 group_id를 공유)
SELECT nextval('booking_group_id_seq');

-- 좌석마다 한 행씩 INSERT
INSERT INTO bookings (booking_group_id, user_id, performance_id,
                      section, row_label, seat_number, price_paid)
SELECT ...;

COMMIT;
```

`SELECT ... FOR UPDATE` 가 두 번째 동시 트랜잭션을 대기시키고, 첫 트랜잭션이 커밋되면 두 번째는 이미 잡힌 좌석을 발견해서 자기 트랜잭션을 ROLLBACK 한다. partial UNIQUE 인덱스는 어떤 경로로든 중복이 끼어드는 걸 막는 마지막 안전망.

말로만 "보장한다"고 적기엔 약하니 통합 테스트로 매번 검증한다.

```ts
// src/domain/bookings.test.ts
it("두 사용자가 동시에 같은 좌석을 잡으면 한쪽만 성공한다", async () => {
  const [a, b] = await Promise.allSettled([
    bookSeats({ userId: userA, performanceId, seats: [A1_1] }),
    bookSeats({ userId: userB, performanceId, seats: [A1_1] }),
  ]);
  expect([a, b].filter(r => r.status === "fulfilled")).toHaveLength(1);
  expect([a, b].filter(r => r.status === "rejected")).toHaveLength(1);
});
```

`Promise.allSettled` 로 두 트랜잭션을 정말 동시에 띄우고, *정확히 하나만 성공하고 하나는 실패하는지* 매 테스트 빌드마다 확인한다.

## 성능 측정 (pgbench)

강의에서 다룬 `pgbench` 로 워크로드를 측정했다. `bench/book_workload.sql` 에 예매 트랜잭션을 작성하고 시나리오별로 `-c`, `-T` 옵션을 바꿔가며 돌렸다.

| 시나리오 | 클라이언트 | TPS | 평균 Latency |
|---|---:|---:|---:|
| Baseline | 1 | 9,001 | 0.11 ms |
| 동시성 (정상) | 10 | 10,691 | 0.88 ms |
| 고부하 | 50 | 8,595 | 4.96 ms |

`-c 1 → 10` 에서는 TPS 가 19% 늘었는데, `-c 50` 에서는 잠금 경합과 컨텍스트 스위칭 비용으로 오히려 떨어졌다. Latency 는 동시성에 거의 선형 비례. 

흥미로웠던 건 인덱스 비교 결과. INSERT 위주 워크로드에서는 인덱스 ON 이 OFF 보다 *약간 느렸다*. 인덱스 유지 비용이 INSERT 마다 들어가서 그렇다. 실서비스는 SELECT 비중이 더 크니 결과가 반대로 나오겠지만, "인덱스 = 무조건 빠름" 이 아니라는 걸 실측으로 본 게 좋았다.

자세한 결과와 분석은 [docs/report.md](docs/report.md) 에 정리했다.

## 화면 흐름

공연 목록 (`/`) → 상세 + 좌석 맵 (`/performances/[id]`) → 좌석 선택 → 예매 → 마이페이지 (`/my`) 에서 취소 가능. `/stats` 에서 점유율 / 결제 TOP 5 / 일별 추이 시각화.

회원가입 / 로그인 / 로그아웃 은 `/auth/*` 에.

## 실행 방법

PostgreSQL 16 이 필요하다. macOS 기준:

```bash
brew install postgresql@16
brew services start postgresql@16
```

DB · 사용자 · 스키마:

```bash
createuser -s florence -P        # 비밀번호: florence
createdb -O florence florence
psql -U florence -d florence -f db/schema.sql
psql -U florence -d florence -f db/seed.sql
```

`.env.local`:

```
DATABASE_URL=postgres://florence:florence@localhost:5432/florence
SESSION_SECRET=anything-at-least-16-chars
```

개발 서버:

```bash
pnpm install
pnpm dev    # http://localhost:3030
```

## 테스트

```bash
# 통합 테스트 (실제 DB 사용)
createdb -O florence florence_test
psql -U florence -d florence_test -f db/schema.sql
pnpm test           # Vitest 10/10

# E2E
createdb -O florence florence_e2e
psql -U florence -d florence_e2e -f db/schema.sql
pnpm exec playwright install chromium
pnpm test:e2e       # Playwright 7/7
```

`.env.test`, `.env.e2e` 는 저장소에 포함되지 않았다. `.env.local` 과 비슷한 형식으로 만들고 DB 이름만 바꾸면 된다.

## 폴더 구조

```
src/
  lib/         인프라 (DB 풀, 트랜잭션 헬퍼, 세션, 비밀번호)
  domain/     SQL 과 비즈니스 규칙 (모든 SQL 은 여기에)
  app/        Next.js 라우트 + 서버 액션
db/
  schema.sql   테이블 + 인덱스
  seed.sql     시드 데이터
e2e/           Playwright 시나리오
bench/         pgbench 워크로드와 실행 스크립트
docs/
  report.md    과제 결과보고서
```

원칙은 단순하다. `lib` 는 라이브러리 래퍼만, `domain` 은 SQL 과 비즈니스 규칙만, `app` 은 렌더링과 액션만. 한 컴포넌트에 다 몰지 않는다.

## 한 줄 회고

5개 테이블로 시작했다가 3개로 줄이는 과정에서 *정규화 과잉도 안티패턴이 될 수 있다*는 걸 직접 느꼈다. 그리고 ORM 없이 SQL 직접 쓰는 게 학습 단계에서는 훨씬 낫다. `EXPLAIN` 보기도 쉽고, 트랜잭션 경계를 명확히 표시하는 강제력이 생긴다.
