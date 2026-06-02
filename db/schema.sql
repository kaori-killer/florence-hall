-- Florence Hall — schema
-- 좌석 예매 서비스. 모든 동시성 보장은 트랜잭션 + booking_seats.seat_id UNIQUE 로 처리.

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
  description   TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS seats (
  id              SERIAL PRIMARY KEY,
  performance_id  INTEGER NOT NULL REFERENCES performances(id) ON DELETE CASCADE,
  section         TEXT NOT NULL,
  row_label       TEXT NOT NULL,
  seat_number     INTEGER NOT NULL,
  UNIQUE (performance_id, section, row_label, seat_number)
);
CREATE INDEX IF NOT EXISTS idx_seats_performance ON seats(performance_id);

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('CONFIRMED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS bookings (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id),
  performance_id  INTEGER NOT NULL REFERENCES performances(id),
  status          booking_status NOT NULL DEFAULT 'CONFIRMED',
  total_amount    INTEGER NOT NULL CHECK (total_amount >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_performance ON bookings(performance_id);

-- 활성 예매에서만 좌석을 점유. 취소 시 booking_seats 행을 삭제하므로 UNIQUE(seat_id) 로 충분.
CREATE TABLE IF NOT EXISTS booking_seats (
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  seat_id    INTEGER NOT NULL REFERENCES seats(id),
  PRIMARY KEY (booking_id, seat_id),
  UNIQUE (seat_id)
);

COMMIT;
