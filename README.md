# Florence Hall

PostgreSQL 기반 좌석 예매 데모. 데이터베이스 과제용으로 만들었고, 다음을 보여주기 위한 목적이 있다.

- 웹 서비스가 DBMS와 어떻게 연동되는지
- 백엔드에서 **릴레이션 / 쿼리 / 트랜잭션**을 어떻게 정의하고 활용하는지

## 기술 스택

- Next.js 16 (App Router) + React 19 + TypeScript
- PostgreSQL 16 (로컬 Homebrew 또는 Docker)
- `pg` (생짜 SQL, ORM 없음) · `bcryptjs` · `zod`
- 테스트: Vitest (도메인 통합 테스트), Playwright (E2E)
- 스타일: Tailwind v4

ORM을 쓰지 않은 이유 — 과제 평가 항목이 "쿼리·트랜잭션을 어떻게 정의했는지"이기 때문에 SQL을 가리지 않았다.

## 폴더 구조

```
src/
  lib/         # 인프라 (DB 풀, 트랜잭션 헬퍼, 세션, 비밀번호, 포매터)
  domain/      # 비즈니스 로직과 SQL이 모이는 곳
    auth.ts        # 회원가입 / 로그인
    performances.ts# 공연 목록 / 상세
    seats.ts       # 좌석 조회
    bookings.ts    # 예매·취소 트랜잭션 (핵심)
    stats.ts       # 통계 쿼리
    *.test.ts      # 통합 테스트
  app/         # Next.js 라우트 + 서버 액션
  test/        # 테스트 픽스처
db/
  schema.sql   # 5개 테이블 + 인덱스
  seed.sql     # 시드 공연 3 + 좌석 90
e2e/
  *.spec.ts    # Playwright 시나리오
```

원칙: **lib는 외부 라이브러리 래퍼만**, **domain은 SQL과 비즈니스 규칙만**, **app은 렌더링과 액션만**. 한 컴포넌트에 다 몰지 않는다.

## 데이터 모델

**3개의 릴레이션**과 외래 키 / partial UNIQUE 인덱스로 구성한다. 좌석 마스터를 별도 테이블로 두지 않고, 좌석 정보를 `bookings` 행에 직접 담아 관리한다.

```
users         (id, email UNIQUE, name, password_hash, created_at)

performances  (id, title, artist, performed_at, price, description, image_url)

bookings      (id, booking_group_id, user_id→users, performance_id→performances,
               section, row_label, seat_number,
               status ∈ {CONFIRMED, CANCELLED},
               price_paid, created_at)

  -- 활성 예매에서만 좌석 점유를 강제하는 partial UNIQUE 인덱스
  UNIQUE (performance_id, section, row_label, seat_number) WHERE status = 'CONFIRMED'
```

- **좌석 배치는 코드 상수**(`src/lib/venue.ts`)에 정의 — 모든 공연이 A·B 섹션 × 3행 × 5번씩 총 30석. DB 테이블을 줄여 도메인을 단순화했다.
- **partial UNIQUE 인덱스**가 "같은 좌석은 동시에 한 명만 점유" 규칙을 DB 레벨에서 강제한다. 취소된 행(CANCELLED)은 인덱스 대상에서 빠지므로 좌석이 자동으로 다시 풀린다.
- 한 번에 여러 좌석을 예매하면 같은 `booking_group_id` 를 공유한다 — 마이페이지에서는 그룹 단위로 묶어 보여주고, 취소도 그룹 단위로 처리.

## 핵심 트랜잭션 — 좌석 예매

`src/domain/bookings.ts`. 한 트랜잭션 안에서 잠금·충돌 검사·그룹 ID 발급·다중 행 INSERT를 끝낸다.

```sql
BEGIN;
  -- 1) 가격 조회
  SELECT price FROM performances WHERE id = $performanceId;

  -- 2) 같은 공연의 활성 예매를 잠근다 (FOR UPDATE).
  --    잠금이 없으면 두 트랜잭션이 동시에 partial UNIQUE 통과를 시도해 한쪽이 늦게 실패하는 경합이 생긴다.
  SELECT section, row_label, seat_number
    FROM bookings
   WHERE performance_id = $performanceId AND status = 'CONFIRMED'
   FOR UPDATE;
  -- → 선택한 좌석 중 이미 활성으로 잡힌 게 있으면 BookingConflictError 로 ROLLBACK

  -- 3) booking_group_id 발급
  SELECT nextval('booking_group_id_seq');

  -- 4) 좌석마다 한 행씩 INSERT (모두 같은 group_id)
  INSERT INTO bookings (booking_group_id, user_id, performance_id,
                        section, row_label, seat_number, price_paid)
       SELECT $gid, $userId, $performanceId, s.section, s.row_label, s.seat_number, $price
         FROM UNNEST($sections, $rows, $numbers) AS s(section, row_label, seat_number);
COMMIT;
```

`SELECT ... FOR UPDATE` 가 두 번째 동시 트랜잭션을 대기시키고, 첫 트랜잭션이 커밋되면 두 번째 트랜잭션은 이미 잡힌 좌석을 발견해 `BookingConflictError` 로 `ROLLBACK` 한다. partial UNIQUE 인덱스가 어떤 경로로든 중복이 들어오는 걸 막아주는 안전망이다.

이 동시성 보장은 단순한 텍스트 설명이 아니라 통합 테스트로 직접 검증된다 — `src/domain/bookings.test.ts` 의 *"두 사용자가 동시에 같은 좌석을 잡으면 한쪽만 성공한다"* 케이스가 `Promise.allSettled`로 두 트랜잭션을 동시에 실행해 하나는 성공, 하나는 실패하는지 확인한다.

## 통계 쿼리 (PPT에 쓸 만한 SQL)

`src/domain/stats.ts`. `/stats` 페이지에서 시각화된다.

1. **공연별 좌석 점유율** — `LEFT JOIN seats / booking_seats` + `GROUP BY` + 비율 계산
2. **결제액 TOP 5** — `users ⨯ bookings JOIN` + `SUM` + `ORDER BY LIMIT`
3. **일별 예매 추이** — `date_trunc('day', created_at)` + `GROUP BY`

## 시작하기

### 0. 사전 준비

PostgreSQL 16 이 설치되어 있어야 한다. macOS는 `brew install postgresql@16 && brew services start postgresql@16` 한 줄. (Docker 옵션은 아래.)

### 1. DB / 환경변수 세팅

```bash
# 사용자와 데이터베이스 생성
createuser -s florence -P    # 비밀번호로 'florence' 입력
createdb -O florence florence
psql -U florence -h localhost -d florence -f db/schema.sql
psql -U florence -h localhost -d florence -f db/seed.sql

# 환경변수
cat > .env.local <<EOF
DATABASE_URL=postgres://florence:florence@localhost:5432/florence
SESSION_SECRET=$(openssl rand -base64 32)
EOF
```

### 2. 개발 서버

```bash
pnpm install
pnpm dev
# → http://localhost:3030
```

### 3. 테스트

도메인 통합 테스트(예매 트랜잭션 동시성 포함):

```bash
# 테스트 DB
createdb -O florence florence_test
psql -U florence -h localhost -d florence_test -f db/schema.sql

# (.env.test 는 이 저장소에 포함되어 있지 않다. 다음 내용으로 생성)
# DATABASE_URL=postgres://florence:florence@localhost:5432/florence_test
# SESSION_SECRET=anything-with-at-least-16-chars
pnpm test
```

E2E (Playwright):

```bash
createdb -O florence florence_e2e
psql -U florence -h localhost -d florence_e2e -f db/schema.sql
# .env.e2e 도 .env.test 와 같은 패턴으로 직접 생성 (florence_e2e)
pnpm exec playwright install chromium
pnpm test:e2e
```

### Docker로 PostgreSQL을 띄우고 싶다면

```bash
docker compose up -d
# DATABASE_URL=postgres://florence:florence@localhost:5432/florence
```

`docker-compose.yml` 은 `db/schema.sql` 과 `db/seed.sql` 을 `docker-entrypoint-initdb.d` 로 자동 로드한다.

## 기능별 화면

| 경로 | 설명 |
|---|---|
| `/` | 공연 목록 (잔여 좌석 표시) |
| `/performances/[id]` | 공연 상세 + 좌석 맵 + 예매 폼 |
| `/auth/signup`, `/auth/login` | 인증 |
| `/my` | 내 예매 / 취소 |
| `/stats` | 점유율 · TOP 5 · 일별 추이 |
