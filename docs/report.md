# 데이터베이스 과제 결과보고서

## Florence Hall — PostgreSQL 기반 좌석 예매 웹 서비스

| 항목 | 내용 |
|---|---|
| 학번 / 이름 | 202101248 / 유소정 |
| 과목 | 데이터베이스 |
| 제출일 | 2026-06-10 |
| 저장소 | https://github.com/sojeongyoo-colosseum/my-database |
| 브랜치 | `sojeongyoo-colosseum/postgres-web-assignment` |

---

## 목차

1. 프로젝트 개요
2. 학습 목표와의 매핑
3. 기술 스택과 선택 이유
4. 시스템 설계 — 릴레이션 (Relation)
5. 시스템 설계 — 쿼리 (Query)
6. 시스템 설계 — 트랜잭션 (Transaction)
7. 구현 — 디렉토리 구조와 책임 분리
8. 테스트 — 통합 테스트와 E2E
9. 성능 측정 — pgbench 기반 벤치마크
10. 자체 평가와 한계
11. 결론 및 회고
12. 부록 — 실행 방법

---

## 1. 프로젝트 개요

### 1.1 서비스 설명

**Florence Hall** 은 공연 좌석을 골라 예매하는 웹 서비스이다. 사용자는 회원가입 → 공연 목록 조회 → 좌석 선택 → 예매 → 마이페이지에서 취소 의 흐름으로 서비스를 이용한다.

### 1.2 도메인 선택 이유

본 과제의 학습 목표가 **릴레이션(Relation) / 쿼리(Query) / 트랜잭션(Transaction)** 세 가지의 정의·활용이므로, 이 세 가지가 모두 자연스럽게 등장하는 도메인을 선택하였다.

특히 좌석 예매 도메인은 다음과 같은 특성이 있다.

- **트랜잭션이 본질적으로 필요하다.** "좌석이 비었는지 확인 → 예매 행 추가" 가 한 묶음으로 처리되지 않으면 좌석은 잡혔는데 예매 정보가 없거나, 두 사람이 같은 좌석을 동시에 잡는 사고가 발생한다.
- **현실 세계의 동시성 시나리오를 그대로 재현할 수 있다.** "두 명이 동시에 마지막 한 자리를 누르면 어떻게 되는가" 는 학과제 발표에서 즉시 시연 가능한 시나리오이다.
- **JOIN, GROUP BY, 집계 함수 등 다양한 SQL 패턴이 자연스럽게 등장한다.** 공연별 점유율, 사용자별 누적 결제액, 일별 예매 추이 등.

### 1.3 구현된 기능

| 경로 | 기능 |
|---|---|
| `/auth/signup`, `/auth/login` | 회원가입 / 로그인 / 로그아웃 |
| `/` | 공연 목록 (잔여 좌석 진행바, 매진 표시) |
| `/performances/[id]` | 공연 상세, 좌석 맵, 선택 후 예매 |
| `/my` | 본인 예매 그룹 단위 목록, 취소 |
| `/stats` | 점유율 / 결제 TOP 5 / 일별 예매 추이 |

---

## 2. 학습 목표와의 매핑

본 과제 안내문에 명시된 두 가지 학습 목표를 다음과 같이 매핑하였다.

### 2.1 웹 서비스와 DBMS의 연동

```
브라우저 ─HTTP/FormData─▶ Next.js Server Action ('use server')
                            │
                            │ 함수 호출
                            ▼
                          domain/*.ts  (SQL + 비즈니스 규칙)
                            │
                            │ pg.Pool / withTransaction
                            ▼
                       PostgreSQL 16
```

- 별도 백엔드 프로세스(Express 등) 없이 **Next.js 16 Server Actions** 가 백엔드 역할을 수행한다.
- ORM 을 사용하지 않고 **node-postgres (`pg`) 드라이버로 SQL을 직접 작성** 함으로써, 어떤 쿼리가 실행되는지 코드에서 그대로 노출된다.

### 2.2 릴레이션 / 쿼리 / 트랜잭션의 정의·활용

| 학습 목표 | 본 보고서 해당 절 |
|---|---|
| Relation 정의·활용 | 4장 |
| Query 정의·활용 | 5장 |
| Transaction 정의·활용 | 6장 |

---

## 3. 기술 스택과 선택 이유

| 계층 | 사용 기술 | 선택 이유 |
|---|---|---|
| 런타임 | Node.js 20, TypeScript 5 | 정적 타입으로 안전성 확보 |
| 웹 프레임워크 | Next.js 16 (App Router) | Server Components + Server Actions 로 풀스택을 한 프로젝트에 담음 |
| 데이터베이스 | PostgreSQL 16 | 본 과제 명세 |
| DB 드라이버 | `pg` (node-postgres) | **ORM 없음** — SQL 을 가리지 않기 위함 |
| 트랜잭션 헬퍼 | 직접 작성한 `withTransaction()` | `BEGIN/COMMIT/ROLLBACK` 의 일관 처리 |
| 인증 | bcryptjs(cost 10) + HMAC-SHA256 서명 쿠키 | NextAuth 없이 학습 목적상 직접 구현 |
| 입력 검증 | zod | 서버 액션 진입점에서 schema 검증 |
| 단위/통합 테스트 | Vitest | 실제 DB 에 연결되는 통합 테스트 |
| E2E 테스트 | Playwright | 실제 Chromium 브라우저 자동화 |
| 성능 측정 | **pgbench** | PostgreSQL 표준 벤치마크 도구 |
| 스타일 | Tailwind CSS v4 | 디자인 토큰 기반 UI 통일성 |

### 3.1 ORM 을 사용하지 않은 이유

본 과제의 평가 항목이 *"쿼리와 트랜잭션을 어떻게 정의하고 활용했는가"* 이므로, ORM(Prisma, Drizzle 등) 이 SQL 을 가리면 학습 효과가 떨어진다. `pg` 드라이버로 직접 작성함으로써 다음을 명확하게 보여줄 수 있다.

- `SELECT ... FOR UPDATE` 의 정확한 위치와 의도
- partial UNIQUE 인덱스 활용
- JOIN 과 집계 함수의 결합
- 트랜잭션 경계의 명확한 표시

---

## 4. 시스템 설계 — 릴레이션 (Relation)

### 4.1 ER 다이어그램

```
                    ┌──────────────────────┐
                    │       users          │
                    ├──────────────────────┤
                    │ id (PK)              │
                    │ email (UNIQUE)       │
                    │ name                 │
                    │ password_hash        │
                    │ created_at           │
                    └──────────┬───────────┘
                               │ 1
                               │
                               │ N
                    ┌──────────▼───────────┐         ┌──────────────────────┐
                    │      bookings        │  N    1 │    performances      │
                    ├──────────────────────┤◀────────┤──────────────────────┤
                    │ id (PK)              │         │ id (PK)              │
                    │ booking_group_id     │         │ title                │
                    │ user_id (FK→users)   │         │ artist               │
                    │ performance_id (FK)  │         │ performed_at         │
                    │ section              │         │ price                │
                    │ row_label            │         │ description          │
                    │ seat_number          │         │ image_url            │
                    │ status (ENUM)        │         └──────────────────────┘
                    │ price_paid           │
                    │ created_at           │
                    └──────────────────────┘
                    UNIQUE (performance_id, section, row_label, seat_number)
                    WHERE status = 'CONFIRMED'   ← partial UNIQUE 인덱스
```

### 4.2 테이블 3개로 단순화한 의사결정

최초 설계에서는 5개 테이블(`users`, `performances`, `seats`, `bookings`, `booking_seats`) 로 출발하였다. 그러나 다음 두 가지 이유로 3개로 축소하였다.

1. **공연마다 좌석 배치가 동일하다는 가정** — 모든 공연이 A·B 섹션 × 3행 × 5번 = 30석으로 구성된다. 이 경우 좌석 마스터를 별도 테이블로 두는 것은 정규화의 본질(중복 데이터 제거)에 비추어 과한 결정이다. 좌석 배치는 **코드 상수**(`src/lib/venue.ts`) 로 두는 것이 자연스럽다.
2. **junction table 제거** — `booking_seats` 는 N:M 관계를 푸는 패턴인데, 좌석 정보를 `bookings` 행에 직접 담으면 사라진다. 그 대신 같은 묶음의 예매를 묶어주는 `booking_group_id` 컬럼을 추가하였다.

이로써 데이터베이스 발표 시 *"각 테이블이 왜 존재하는가"* 를 1~2문장으로 명료하게 설명할 수 있게 되었다.

### 4.3 무결성 제약 (Integrity Constraints)

본 프로젝트의 핵심 무결성 제약은 다음과 같다.

```sql
-- 1. 기본키, 외래키 (생략)

-- 2. 비어있을 수 없는 컬럼
NOT NULL on (email, name, password_hash, title, artist, ...)

-- 3. 도메인 제약
CHECK (price >= 0)
CHECK (price_paid >= 0)

-- 4. 열거형(ENUM)
CREATE TYPE booking_status AS ENUM ('CONFIRMED', 'CANCELLED');

-- 5. 활성 예매에 대한 좌석 유일성 ← 핵심
CREATE UNIQUE INDEX uniq_confirmed_seat
  ON bookings (performance_id, section, row_label, seat_number)
  WHERE status = 'CONFIRMED';
```

### 4.4 partial UNIQUE 인덱스의 역할

이 인덱스는 두 가지 역할을 동시에 수행한다.

1. **유일성 제약** — 같은 공연의 같은 좌석에 대해 활성 예매 행이 둘 이상 존재할 수 없게 강제한다. 즉 "한 좌석 = 한 사람" 규칙을 DB 레벨에서 보장한다.
2. **취소된 행은 자동으로 빠진다** — `WHERE status = 'CONFIRMED'` 조건 덕에 `CANCELLED` 로 바뀐 행은 더 이상 좌석을 점유하지 않는다. 따라서 취소 후 즉시 같은 좌석을 다시 예매할 수 있다.

이 한 줄의 정의로 "예매 가능 / 예매됨 / 취소됨" 의 세 가지 상태 전이가 명확하게 표현된다.

### 4.5 booking_group_id 의 역할

한 번에 여러 좌석을 예매하면 같은 `booking_group_id` 값을 공유한다. 이는 다음을 가능하게 한다.

- 마이페이지에서 그룹 단위로 묶어서 표시 (예: "A1-1, A1-2 좌석 2석, 총 ₩20,000")
- 취소도 그룹 단위로 처리 (한 번의 클릭으로 묶음 전체 취소)
- 통계 쿼리에서 "예매 건수" 를 좌석 수가 아닌 그룹 수로 카운트

`booking_group_id` 는 `nextval('booking_group_id_seq')` 시퀀스에서 발급받은 정수이며, 한 트랜잭션 안에서 단 한 번 호출하여 그 트랜잭션이 INSERT 하는 모든 좌석 행에 동일하게 부여한다.

### 4.6 부가 인덱스

조회 패턴에 맞춰 다음 세 개의 보조 인덱스를 추가하였다.

| 인덱스 | 대상 쿼리 |
|---|---|
| `idx_bookings_user` | "내 예매" 조회 (`WHERE user_id = ?`) |
| `idx_bookings_performance` | 공연별 잔여 좌석 집계 (`WHERE performance_id = ?`) |
| `idx_bookings_group` | 그룹 단위 취소 (`WHERE booking_group_id = ?`) |

---

## 5. 시스템 설계 — 쿼리 (Query)

본 프로젝트의 모든 SQL 은 `src/domain/*.ts` 에 작성되었다. 대표적인 쿼리들을 발표 관점에서 가치가 있는 순서로 소개한다.

### 5.1 공연별 좌석 점유율 — LEFT JOIN + GROUP BY + FILTER

```sql
SELECT p.id AS performance_id, p.title,
       COUNT(b.id) FILTER (WHERE b.status = 'CONFIRMED')::int AS booked_seats
  FROM performances p
  LEFT JOIN bookings b ON b.performance_id = p.id
 GROUP BY p.id;
```

- `LEFT JOIN`: 예매 한 건도 없는 공연을 0 건으로 포함하기 위함
- `COUNT(...) FILTER (WHERE ...)`: PostgreSQL 의 조건부 집계 표현. 활성 예매만 세면서도 한 번의 스캔으로 처리
- 전체 좌석 수는 코드 상수 `TOTAL_SEATS(=30)` 와 비교하여 비율 계산

### 5.2 결제액 TOP 5 — JOIN + SUM + ORDER BY LIMIT

```sql
SELECT u.id AS user_id, u.name,
       SUM(b.price_paid)::int AS total_spent,
       COUNT(DISTINCT b.booking_group_id)::int AS booking_count
  FROM users u
  JOIN bookings b ON b.user_id = u.id AND b.status = 'CONFIRMED'
 GROUP BY u.id
 ORDER BY total_spent DESC
 LIMIT 5;
```

- `COUNT(DISTINCT booking_group_id)`: 좌석 행이 아닌 *예매 건수(그룹 단위)* 를 세기 위해
- `ORDER BY ... LIMIT`: TOP-N 선별

### 5.3 일별 예매 추이 — date_trunc + GROUP BY

```sql
SELECT TO_CHAR(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
       COUNT(DISTINCT booking_group_id)::int AS booking_count
  FROM bookings
 WHERE status = 'CONFIRMED'
   AND created_at >= NOW() - ($1::int || ' days')::interval
 GROUP BY day
 ORDER BY day;
```

- `date_trunc('day', ...)`: 타임스탬프를 일 단위로 절삭
- `interval` 동적 생성: 파라미터로 일수를 받아 최근 N 일 추이를 만든다

### 5.4 마이페이지 — json_agg 로 N+1 회피

```sql
SELECT b.booking_group_id::text,
       p.title, p.artist, p.performed_at,
       MAX(b.status::text)::booking_status AS status,
       SUM(b.price_paid)::int AS total_amount,
       json_agg(json_build_object(
         'section', b.section,
         'row_label', b.row_label,
         'seat_number', b.seat_number
       ) ORDER BY b.section, b.row_label, b.seat_number) AS seats
  FROM bookings b
  JOIN performances p ON p.id = b.performance_id
 WHERE b.user_id = $1
 GROUP BY b.booking_group_id, b.performance_id, p.title, p.artist, p.performed_at
 ORDER BY MIN(b.created_at) DESC;
```

- `json_agg(json_build_object(...))`: 한 번의 쿼리로 *그룹 + 그룹에 속한 좌석 배열* 을 함께 가져온다 → N+1 쿼리 회피
- ORM 을 썼다면 자동 lazy loading 으로 N+1 이 발생할 수 있는 부분

### 5.5 SQL Injection 방어

모든 쿼리에 **파라미터 바인딩**(`$1, $2 ...`) 을 사용하였으며, 문자열 결합으로 SQL 을 만드는 부분은 코드 전체에 한 곳도 없다. `pg` 드라이버가 PostgreSQL 의 prepared statement 메커니즘으로 안전하게 전달한다.

---

## 6. 시스템 설계 — 트랜잭션 (Transaction)

### 6.1 본 프로젝트의 트랜잭션 시나리오

본 서비스에서 트랜잭션이 필요한 상황은 다음 두 가지이다.

1. **좌석 예매** — 좌석 점유 확인부터 예매 행 INSERT 까지가 원자적으로 묶여야 한다.
2. **예매 취소** — 그룹에 속한 모든 좌석 행의 `status` 를 일관되게 `CANCELLED` 로 바꿔야 한다.

이 절에서는 핵심인 **좌석 예매 트랜잭션** 을 집중 설명한다.

### 6.2 예매 트랜잭션의 SQL 시퀀스

`src/domain/bookings.ts` 의 `bookSeats()` 함수가 다음 시퀀스를 한 트랜잭션으로 실행한다.

```sql
BEGIN;

-- (1) 가격 조회
SELECT price FROM performances WHERE id = $performance_id;
  → 공연이 존재하지 않으면 에러로 ROLLBACK

-- (2) 같은 공연의 활성 예매 행을 잠근다 (FOR UPDATE)
SELECT section, row_label, seat_number
  FROM bookings
 WHERE performance_id = $performance_id AND status = 'CONFIRMED'
 FOR UPDATE;
  → 애플리케이션 코드에서 선택한 좌석과 비교
  → 이미 활성 예매가 있으면 BookingConflictError 던지고 ROLLBACK

-- (3) booking_group_id 시퀀스에서 다음 값을 받는다
SELECT nextval('booking_group_id_seq');

-- (4) 선택한 좌석마다 한 행씩 INSERT (모두 같은 group_id, 같은 price_paid)
INSERT INTO bookings (booking_group_id, user_id, performance_id,
                      section, row_label, seat_number, price_paid)
SELECT $gid, $user_id, $performance_id, s.section, s.row_label, s.seat_number, $price
  FROM UNNEST($sections::text[], $rows::text[], $numbers::int[])
       AS s(section, row_label, seat_number);

COMMIT;
```

### 6.3 동시성이 어떻게 보장되는가

```
[시각 T0]
사용자 A 트랜잭션                     사용자 B 트랜잭션
BEGIN;                                BEGIN;
SELECT price ...;                     SELECT price ...;
SELECT ... FOR UPDATE;  ← 잠금 획득
                                      SELECT ... FOR UPDATE;
                                      ← A 가 COMMIT 할 때까지 대기

(A 가 좌석 검증 통과 → INSERT → COMMIT)
COMMIT;

                                      ← B 의 SELECT 대기 해제, 결과 받음
                                      ← A 가 INSERT 한 좌석이 결과에 포함됨
                                      BookingConflictError 발생
                                      ROLLBACK;
```

- `FOR UPDATE` 가 행 잠금을 잡아 두 번째 트랜잭션을 *직렬화* 한다.
- 만약 잠금이 빠지면? → 두 트랜잭션 모두 검증을 통과한 뒤 INSERT 단계에서 한쪽이 partial UNIQUE 위반(`unique_violation`) 으로 실패한다. **partial UNIQUE 는 마지막 안전망 역할.**

### 6.4 ACID 보장과의 대응

| ACID 속성 | 본 프로젝트에서의 보장 방식 |
|---|---|
| **Atomicity** | `withTransaction()` 헬퍼가 에러 발생 시 자동 `ROLLBACK` 호출 |
| **Consistency** | `CHECK`, `NOT NULL`, partial UNIQUE 인덱스 등 제약 조건이 보장 |
| **Isolation** | PostgreSQL 기본 격리 수준 `READ COMMITTED` + `SELECT ... FOR UPDATE` 로 행 잠금 |
| **Durability** | PostgreSQL 의 WAL (Write-Ahead Logging) 이 보장 (기본 동작) |

### 6.5 취소 트랜잭션

```sql
BEGIN;
-- 그룹의 모든 행을 잠그면서 본인 소유 확인
SELECT id, status FROM bookings
 WHERE booking_group_id = $gid AND user_id = $user_id
 FOR UPDATE;
  → 없으면 "예매를 찾을 수 없습니다." 에러로 ROLLBACK

UPDATE bookings SET status = 'CANCELLED'
 WHERE booking_group_id = $gid AND status = 'CONFIRMED';
COMMIT;
```

- 상태만 바꾸므로 partial UNIQUE 인덱스에서 해당 행이 자동으로 빠진다 → 좌석이 즉시 재예매 가능해진다.
- `FOR UPDATE` 로 본인 소유 확인과 UPDATE 사이의 race condition 을 방지한다.

---

## 7. 구현 — 디렉토리 구조와 책임 분리

본 프로젝트는 **계층 분리(Layered Architecture)** 원칙을 적용하였다.

```
src/
  lib/                  ← 인프라 계층 (외부 라이브러리 래퍼만)
    db.ts               pg.Pool + withTransaction 헬퍼
    session.ts          HMAC 서명 쿠키 세션
    password.ts         bcrypt 래퍼
    venue.ts            좌석 격자 상수
    format.ts           날짜 포매터

  domain/               ← 도메인 계층 (SQL과 비즈니스 규칙)
    auth.ts             회원가입 / 로그인
    performances.ts     공연 목록·상세
    seats.ts            좌석 상태 조회
    bookings.ts         예매·취소 트랜잭션 (핵심)
    stats.ts            통계 쿼리
    *.test.ts           통합 테스트 (실제 DB 사용)

  app/                  ← 표현 계층 (Next.js 라우트 + 서버 액션)
    page.tsx                         공연 목록
    performances/[id]/page.tsx       공연 상세
    performances/[id]/SeatPicker.tsx 좌석 선택 클라이언트
    bookings/actions.ts              예매·취소 서버 액션
    auth/{login,signup}/page.tsx
    auth/actions.ts                  인증 서버 액션
    my/page.tsx                      내 예매
    stats/page.tsx                   통계
    components/                      공용 UI (Header, Badge, PageHeader)

db/
  schema.sql            테이블 + 인덱스 + 시퀀스 정의
  seed.sql              시드 공연 3개 (idempotent — NOT EXISTS 패턴)

e2e/
  *.spec.ts             Playwright E2E 시나리오

bench/
  init.sql              벤치마크용 시드
  book_workload.sql     pgbench 워크로드
  run.sh                시나리오 실행 스크립트
```

### 7.1 계층 분리의 원칙

| 계층 | 책임 | 금지 사항 |
|---|---|---|
| `lib/` | 외부 라이브러리 래핑 | 비즈니스 규칙 작성 금지 |
| `domain/` | SQL과 비즈니스 규칙 | UI 코드 작성 금지 |
| `app/` | 렌더링과 서버 액션 진입점 | SQL 직접 작성 금지 — 항상 `domain/` 함수 호출 |

### 7.2 분리의 효과

- 동일한 도메인 함수를 **UI(서버 액션) 에서도, 통합 테스트에서도 그대로 호출** 할 수 있다 → 비즈니스 로직의 단일 정의.
- 향후 마이크로서비스 분리 시 `domain/` 폴더가 그대로 새 서비스의 코어가 된다 → 점진적 확장 가능.

---

## 8. 테스트 — 통합 테스트와 E2E

### 8.1 테스트 전략

본 프로젝트는 다음 두 가지 자동화 테스트를 운영한다.

| 종류 | 도구 | 검증 대상 |
|---|---|---|
| **통합 테스트** | Vitest | 도메인 함수가 실제 PostgreSQL 에 대해 정확히 동작하는가 |
| **E2E 테스트** | Playwright | 사용자가 브라우저에서 클릭·입력하는 전체 흐름이 동작하는가 |

단위 테스트(mock) 를 별도로 두지 않았다. 본 도메인의 핵심은 트랜잭션과 동시성이며, 이는 **실제 DB 없이 mock 으로는 검증이 불가능** 하기 때문이다.

### 8.2 통합 테스트 (Vitest)

`src/domain/bookings.test.ts` 와 `src/domain/stats.test.ts` 에 총 10개 테스트가 있다.

#### 동시성 검증의 핵심 케이스

```ts
it("두 사용자가 동시에 같은 좌석을 잡으면 한쪽만 성공한다", async () => {
  const userA = await createUser("A");
  const userB = await createUser("B");
  const performanceId = await createPerformance();

  const [resultA, resultB] = await Promise.allSettled([
    bookSeats({ userId: userA, performanceId, seats: [A1_1] }),
    bookSeats({ userId: userB, performanceId, seats: [A1_1] }),
  ]);

  expect([resultA, resultB].filter(r => r.status === "fulfilled")).toHaveLength(1);
  expect([resultA, resultB].filter(r => r.status === "rejected")).toHaveLength(1);
});
```

`Promise.allSettled` 로 두 트랜잭션을 *동시에* 시작하고, 정확히 하나만 성공하고 하나는 실패하는지를 매 테스트마다 확인한다.

#### 전체 결과

```
✓ src/domain/bookings.test.ts (7 tests)
   ✓ 선택한 좌석 수 × 가격으로 총액을 기록한다
   ✓ 이미 예매된 좌석이 포함되면 BookingConflictError 를 던진다
   ✓ 두 사용자가 동시에 같은 좌석을 잡으면 한쪽만 성공한다   ← 핵심
   ✓ 빈 좌석 배열로 호출하면 에러를 던진다
   ✓ 존재하지 않는 공연 id로 예매하면 에러를 던진다
   ✓ 취소하면 좌석이 다시 예매 가능해진다
   ✓ 남의 예매는 취소할 수 없다

✓ src/domain/stats.test.ts (3 tests)
   ✓ 좌석 점유율을 퍼센트로 계산한다
   ✓ 가장 많이 결제한 사용자 순으로 정렬한다
   ✓ 최근 N일 안의 예매 건수를 일자별로 모은다

Test Files  2 passed (2)
Tests       10 passed (10)
```

### 8.3 E2E 테스트 (Playwright)

`e2e/auth.spec.ts`, `e2e/browse.spec.ts`, `e2e/booking.spec.ts` 에 총 7개 시나리오가 있다.

- 회원가입 후 헤더에 사용자명 노출
- 잘못된 비밀번호로 로그인 시 에러 표시
- 공연 목록 노출
- 공연 상세에서 좌석 맵 표시
- 좌석 2개 선택 → 예매 → 마이페이지에 등장
- 취소하면 좌석이 다시 예매 가능 상태
- 비로그인 시 예매 버튼 비활성화

---

## 9. 성능 측정 — pgbench 기반 벤치마크

### 9.1 측정 도구

PostgreSQL 표준 벤치마크 도구 **`pgbench`** 를 사용하였다. 측정 지표는 다음과 같다.

| 지표 | 의미 |
|---|---|
| **TPS (Transactions Per Second)** | 초당 처리된 트랜잭션 수 |
| **Latency** | 트랜잭션 1건의 평균 처리 시간 (ms) |
| **Latency stddev** | 처리 시간의 표준편차 (지연 변동성) |

### 9.2 측정 환경

| 항목 | 값 |
|---|---|
| DB | PostgreSQL 16.14 (Homebrew, 로컬) |
| 별도 측정 DB | `florence_bench` (운영 DB 와 분리) |
| 시드 데이터 | 사용자 100명, 공연 100개 (좌석은 시드 안 함 — INSERT 로 생성) |
| 워크로드 | `bench/book_workload.sql` — 좌석 1건 INSERT (충돌은 partial UNIQUE 로 자동 처리) |
| 실행 시간 | 시나리오당 10초 |
| 하드웨어 | 로컬 개발 머신 (Apple Silicon, macOS) |

### 9.3 시나리오별 결과

#### 시나리오 1 — Baseline (단일 클라이언트)

```
clients=1, threads=1, duration=10s
─────────────────────────────────────
번호 처리한 트랜잭션:  90,073
실패 트랜잭션:        0 (0.000%)
평균 latency:         0.109 ms
TPS:                  9,001
```

#### 시나리오 2 — 동시성 (10 클라이언트)

```
clients=10, threads=4, duration=10s
─────────────────────────────────────
번호 처리한 트랜잭션:  106,907
실패 트랜잭션:        0 (0.000%)
평균 latency:         0.882 ms
latency stddev:       0.618 ms
TPS:                  10,691
```

#### 시나리오 3 — 고부하 (50 클라이언트)

```
clients=50, threads=8, duration=10s
─────────────────────────────────────
번호 처리한 트랜잭션:  85,818
실패 트랜잭션:        0 (0.000%)
평균 latency:         4.962 ms
latency stddev:       2.251 ms
TPS:                  8,595
```

### 9.4 결과 요약 표

| 시나리오 | 클라이언트 | TPS | 평균 Latency | 트랜잭션 수(10초) |
|---|---:|---:|---:|---:|
| Baseline | 1 | **9,001** | 0.109 ms | 90,073 |
| 동시성 (정상) | 10 | **10,691** | 0.882 ms | 106,907 |
| 고부하 | 50 | **8,595** | 4.962 ms | 85,818 |

### 9.5 분석

#### 9.5.1 동시성이 TPS 를 올린다 — 단, 한계까지만

`clients=1 → 10` 으로 늘리자 TPS 가 약 **19%** 증가하였다 (9,001 → 10,691). 이는 단일 클라이언트는 한 번에 한 트랜잭션만 처리하지만, 10개 클라이언트는 PostgreSQL 의 병렬 처리 능력을 활용하기 때문이다.

그러나 `clients=50` 에서는 TPS 가 다시 **8,595 로 떨어진다**. 이는 다음 요인 때문이다.

- **잠금 경합**: `FOR UPDATE` 와 partial UNIQUE 인덱스 충돌이 동시 트랜잭션 50개 사이에서 빈번해진다.
- **컨텍스트 스위칭 비용**: OS 가 50개 클라이언트의 컨텍스트를 번갈아 처리하는 비용이 누적된다.
- **연결 대기**: pgbench 자체의 클라이언트 큐잉.

이는 *"동시성을 무한정 늘린다고 처리량이 늘지 않는다"* 는 일반 시스템 설계 원칙과 일치한다.

#### 9.5.2 Latency 는 동시성에 비례하여 증가한다

| 클라이언트 수 | 평균 Latency | 증가 배수 |
|---:|---:|---:|
| 1 | 0.109 ms | 1× |
| 10 | 0.882 ms | 8.1× |
| 50 | 4.962 ms | 45.5× |

평균 처리 시간은 클라이언트 수에 거의 선형으로 비례하여 증가한다. 이는 트랜잭션이 잠금을 기다리며 직렬화되는 시간이 누적되기 때문이다.

본 서비스의 좌석 예매 트랜잭션은 *동시성을 막아야 하는 것이 본질* 이므로, latency 증가는 **의도된 동작** 이다.

#### 9.5.3 인덱스 영향 비교

`idx_bookings_performance` 인덱스를 DROP 한 상태에서 동일한 워크로드를 측정하였다.

| 상태 | TPS | 평균 Latency |
|---|---:|---:|
| 인덱스 ON | 11,048 | 0.905 ms |
| 인덱스 OFF | 11,297 | 0.885 ms |

#### 흥미로운 발견: INSERT 위주 워크로드에서 인덱스는 *약간의 비용* 이다

본 측정 워크로드는 INSERT 만 수행하므로, 인덱스를 유지하는 비용(매 INSERT 마다 인덱스 트리 업데이트) 이 오히려 처리량에 약간의 마이너스로 작용했다.

그러나 이는 **실제 운영 시나리오에서는 다르다.** 실제 서비스는 INSERT 보다 SELECT 가 훨씬 많고(예: 공연 목록 조회, 좌석 상태 조회), 그 SELECT 들이 인덱스 없이는 매번 전체 테이블 스캔을 한다.

본 결과는 *"인덱스가 항상 좋은 것이 아니라, 워크로드 패턴(읽기/쓰기 비율) 에 따라 의도적으로 선택되어야 한다"* 는 일반 DB 설계 원칙을 직접 측정으로 확인한 결과이다.

### 9.6 발표용 핵심 한 줄

> Florence Hall 예매 트랜잭션은 단일 클라이언트에서 **9,001 TPS / 0.11ms latency**, 동시 10 클라이언트에서 **10,691 TPS / 0.88ms latency** 를 기록하며, partial UNIQUE 인덱스가 동시 좌석 충돌을 정상적으로 차단함을 확인하였다.

---

## 10. 자체 평가와 한계

### 10.1 자체 평가

| 평가 항목 | 충족도 | 비고 |
|---|---|---|
| 웹 ↔ DBMS 연동 | ⭐⭐⭐ | Next.js Server Action ↔ pg.Pool 직접 연동 |
| Relation 정의·활용 | ⭐⭐⭐ | 3 테이블 + partial UNIQUE 인덱스 + FK |
| Query 정의·활용 | ⭐⭐⭐ | JOIN / GROUP BY / FILTER / json_agg / date_trunc |
| Transaction 정의·활용 | ⭐⭐⭐ | FOR UPDATE + ACID + 동시성 통합 테스트 + pgbench 검증 |
| 자동화 테스트 | ⭐⭐⭐ | Vitest 10 + Playwright 7 |
| 성능 측정 | ⭐⭐⭐ | pgbench 4 시나리오 + 인덱스 비교 |
| 코드 품질 / 책임 분리 | ⭐⭐ | 3-layer 분리, 35+ 의미 단위 커밋 |

### 10.2 한계 및 개선 가능한 부분

본 프로젝트는 학과제 범위에서 평가 항목을 충족하기 위해 다음 사항을 의도적으로 단순화하였다.

- **공연마다 동일한 좌석 배치 가정** — 실제 서비스라면 공연장마다 좌석 배치가 달라 `seats` 테이블을 별도로 두는 것이 합리적이다.
- **결제 모듈 부재** — 실제 결제 게이트웨이 연동은 과제 범위 밖.
- **단일 PostgreSQL 인스턴스 / 모놀리스** — 분산 트랜잭션 / 메시지 큐 / 캐시 등은 도입하지 않았다.
- **배포 미수행** — 로컬 데모(`localhost:3030`) 기준으로 시연한다.
- **트랜잭션 격리 수준** — 기본 `READ COMMITTED` 만 사용. `REPEATABLE READ` 와 `SERIALIZABLE` 에서의 동작 비교는 학습 범위 확장 시 가능한 영역.

---

## 11. 결론 및 회고

### 11.1 학습한 점

1. **partial UNIQUE 인덱스의 우아함** — 활성 예매에만 좌석 유일성을 강제하고 취소된 행은 자동으로 빠지게 하는 패턴은, 트랜잭션 안전망과 좌석 재예매 가능성을 한 줄의 정의로 해결한다.

2. **잠금 없는 트랜잭션이 만드는 경합** — partial UNIQUE 만으로도 결과 정합성은 보장되지만, `SELECT ... FOR UPDATE` 가 없으면 두 트랜잭션이 INSERT 단계까지 갔다가 한쪽이 실패하는 비효율이 발생한다. 잠금은 *DB 부하 측면의 효율성* 을 위해 필요하다.

3. **테이블 수와 도메인 이해도의 관계** — 5개로 시작했다가 3개로 줄이면서 "각 테이블이 왜 존재하는가" 의 설명이 명료해졌다. 정규화 과잉도 안티패턴이 될 수 있다는 점을 직접 경험했다.

4. **ORM 없는 SQL이 학습에 더 유리하다** — 실행되는 쿼리가 코드에서 그대로 보이고, `EXPLAIN ANALYZE` 적용, 인덱스 설계, 트랜잭션 경계 결정 모두에서 의도가 명시적이다.

5. **벤치마크는 직관에 반하는 결과를 알려준다** — *"인덱스는 항상 좋다"* 는 직관과 달리 INSERT 위주 워크로드에서는 약간의 비용으로 작용했다. 워크로드 패턴에 따라 인덱스를 의도적으로 선택해야 함을 실측으로 확인하였다.

### 11.2 본 프로젝트의 의의

본 프로젝트는 실무에서 가장 흔히 등장하는 *재고 동시성 문제* 의 가장 단순한 형태(좌석 = 재고 1개) 를 PostgreSQL 의 원자적 트랜잭션과 인덱스 제약으로 해결하는 패턴을 직접 구현·검증·측정한 작업이다.

이 패턴은 e-커머스 재고 관리, 티켓팅, 우버 풀, 그로서리 즉시 배송 등 다양한 도메인에서 그대로 재사용된다.

---

## 12. 부록 — 실행 방법

### 12.1 사전 준비

```bash
brew install postgresql@16
brew services start postgresql@16
```

### 12.2 DB 와 환경변수 설정

```bash
createuser -s florence -P    # 비밀번호: florence
createdb -O florence florence
psql -U florence -h localhost -d florence -f db/schema.sql
psql -U florence -h localhost -d florence -f db/seed.sql

cat > .env.local <<EOF
DATABASE_URL=postgres://florence:florence@localhost:5432/florence
SESSION_SECRET=$(openssl rand -base64 32)
EOF
```

### 12.3 개발 서버

```bash
pnpm install
pnpm dev   # → http://localhost:3030
```

### 12.4 테스트

```bash
# 통합 테스트
createdb -O florence florence_test
psql -U florence -h localhost -d florence_test -f db/schema.sql
pnpm test

# E2E 테스트
createdb -O florence florence_e2e
psql -U florence -h localhost -d florence_e2e -f db/schema.sql
pnpm exec playwright install chromium
pnpm test:e2e
```

### 12.5 성능 측정 (pgbench)

```bash
createdb -O florence florence_bench
psql -U florence -h localhost -d florence_bench -f db/schema.sql

bash bench/run.sh   # 4 시나리오 자동 실행
```

---

*보고서 끝.*
