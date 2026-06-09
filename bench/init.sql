-- bench/init.sql
-- 벤치마크 측정용 시드 데이터.
-- 사용자 100명, 공연 100개를 미리 채워둔다. (공연이 많아야 좌석이 빨리 안 차고
-- 측정 시간 동안 충분한 트랜잭션이 흘러간다.)

BEGIN;

-- 기존 데이터 정리
TRUNCATE bookings, performances, users RESTART IDENTITY CASCADE;
ALTER SEQUENCE booking_group_id_seq RESTART WITH 1;

-- 사용자 100명
INSERT INTO users (email, name, password_hash)
SELECT
  'bench-' || g || '@test.local',
  '벤치사용자-' || g,
  'x'
FROM generate_series(1, 100) g;

-- 공연 100개 (가격은 5,000 ~ 50,000 사이 랜덤)
INSERT INTO performances (title, artist, performed_at, price)
SELECT
  '벤치 공연 ' || g,
  '벤치 아티스트 ' || g,
  NOW() + (g || ' days')::interval,
  5000 + (g * 100) % 45000
FROM generate_series(1, 100) g;

COMMIT;
