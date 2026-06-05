-- Florence Hall — schema (3 tables)
-- 좌석 정보는 bookings 행에 직접 들어가고, partial UNIQUE 가 동시 점유를 막는다.

BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS performances (
  id            SERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  artist        TEXT NOT NULL,
  performed_at  TIMESTAMPTZ NOT NULL,
  price         INTEGER NOT NULL CHECK (price >= 0),
  description   TEXT NOT NULL DEFAULT '',
  image_url     TEXT
);

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('CONFIRMED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 한 번에 여러 좌석을 예매하면 같은 booking_group_id 를 공유한다.
-- 사용자는 booking_group_id 단위로 마이페이지에서 묶음을 보고 취소한다.
CREATE SEQUENCE IF NOT EXISTS booking_group_id_seq;

CREATE TABLE IF NOT EXISTS bookings (
  id                SERIAL PRIMARY KEY,
  booking_group_id  BIGINT NOT NULL,
  user_id           INTEGER NOT NULL REFERENCES users(id),
  performance_id    INTEGER NOT NULL REFERENCES performances(id),
  section           TEXT NOT NULL,
  row_label         TEXT NOT NULL,
  seat_number       INTEGER NOT NULL,
  status            booking_status NOT NULL DEFAULT 'CONFIRMED',
  price_paid        INTEGER NOT NULL CHECK (price_paid >= 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_performance ON bookings(performance_id);
CREATE INDEX IF NOT EXISTS idx_bookings_group ON bookings(booking_group_id);

-- 활성(CONFIRMED) 예매만 좌석을 점유한다. 취소된 행은 영향 없음.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_confirmed_seat
  ON bookings (performance_id, section, row_label, seat_number)
  WHERE status = 'CONFIRMED';

COMMIT;
