-- bench/book_workload.sql
-- pgbench 가 클라이언트마다 매 트랜잭션 실행하는 워크로드.
--
-- 시뮬레이션: "랜덤한 사용자가 랜덤한 공연의 랜덤한 좌석을 1석 예매" 시도
--
-- 좌석이 이미 잡혀 있으면 partial UNIQUE 인덱스(uniq_confirmed_seat) 에 막혀
-- 새 행이 들어가지 못한다. ON CONFLICT DO NOTHING 로 충돌을 받아주면 트랜잭션은
-- COMMIT 되지만 row 가 0건 들어간다. 도메인 코드에서 BookingConflictError 로
-- ROLLBACK 하는 것과 DB 부하 관점에선 동일한 작업량이다.

\set user_id random(1, 100)
\set perf_id random(1, 100)
\set sec random(0, 1)
\set row_idx random(1, 3)
\set seat random(1, 5)

BEGIN;

INSERT INTO bookings
  (booking_group_id, user_id, performance_id,
   section, row_label, seat_number, price_paid)
VALUES (
  nextval('booking_group_id_seq'),
  :user_id,
  :perf_id,
  CASE WHEN :sec = 0 THEN 'A' ELSE 'B' END,
  (:row_idx)::text,
  :seat,
  10000
)
ON CONFLICT (performance_id, section, row_label, seat_number)
  WHERE status = 'CONFIRMED'
  DO NOTHING;

COMMIT;
