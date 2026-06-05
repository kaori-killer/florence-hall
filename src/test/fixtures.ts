import { pool } from "@/lib/db";

export async function resetDb(): Promise<void> {
  await pool.query("TRUNCATE bookings, performances, users RESTART IDENTITY CASCADE");
  await pool.query("ALTER SEQUENCE booking_group_id_seq RESTART WITH 1");
}

export async function createUser(name = "테스터"): Promise<number> {
  const result = await pool.query<{ id: number }>(
    `INSERT INTO users (email, name, password_hash)
     VALUES ($1, $2, $3) RETURNING id`,
    [`${name}-${Date.now()}-${Math.random()}@test.local`, name, "x"],
  );
  return result.rows[0].id;
}

export async function createPerformance(price = 10000): Promise<number> {
  const result = await pool.query<{ id: number }>(
    `INSERT INTO performances (title, artist, performed_at, price)
     VALUES ('테스트 공연', '테스트 아티스트', NOW() + INTERVAL '7 days', $1)
     RETURNING id`,
    [price],
  );
  return result.rows[0].id;
}
