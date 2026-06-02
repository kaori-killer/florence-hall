import { pool } from "@/lib/db";

export async function resetDb(): Promise<void> {
  await pool.query(
    "TRUNCATE booking_seats, bookings, seats, performances, users RESTART IDENTITY CASCADE",
  );
}

export async function createUser(name = "테스터"): Promise<number> {
  const result = await pool.query<{ id: number }>(
    `INSERT INTO users (email, name, password_hash)
     VALUES ($1, $2, $3) RETURNING id`,
    [`${name}-${Date.now()}-${Math.random()}@test.local`, name, "x"],
  );
  return result.rows[0].id;
}

export async function createPerformanceWithSeats(
  seatCount = 4,
  price = 10000,
): Promise<{ performanceId: number; seatIds: number[] }> {
  const performance = await pool.query<{ id: number }>(
    `INSERT INTO performances (title, artist, performed_at, price)
     VALUES ('테스트 공연', '테스트 아티스트', NOW() + INTERVAL '7 days', $1)
     RETURNING id`,
    [price],
  );
  const performanceId = performance.rows[0].id;
  const seats = await pool.query<{ id: number }>(
    `INSERT INTO seats (performance_id, section, row_label, seat_number)
     SELECT $1, 'A', '1', n FROM generate_series(1, $2) AS n
     RETURNING id`,
    [performanceId, seatCount],
  );
  return { performanceId, seatIds: seats.rows.map((r) => r.id) };
}
