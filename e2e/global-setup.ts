import { config } from "dotenv";
import path from "node:path";
import { Pool } from "pg";

export default async function globalSetup(): Promise<void> {
  config({ path: path.resolve(__dirname, "../.env.e2e"), override: true });

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL must be set for e2e");
  if (!url.includes("florence_e2e")) {
    throw new Error("Refusing to run e2e against non-e2e database");
  }

  const pool = new Pool({ connectionString: url });
  try {
    await pool.query("TRUNCATE bookings, performances, users RESTART IDENTITY CASCADE");
    await pool.query("ALTER SEQUENCE booking_group_id_seq RESTART WITH 1");
    await pool.query(`
      INSERT INTO performances (title, artist, performed_at, price, description, image_url) VALUES
        ('E2E 봄밤의 콘서트',  'E2E 필하모닉', NOW() + INTERVAL '14 days', 50000, 'E2E 시드 데이터',
         'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80'),
        ('E2E 재즈 인 더 시티', 'E2E 트리오',   NOW() + INTERVAL '21 days', 35000, 'E2E 시드 데이터',
         'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=80'),
        ('E2E Indie Night',     'E2E Band',     NOW() + INTERVAL '7 days',  25000, 'E2E 시드 데이터',
         'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80')
    `);
  } finally {
    await pool.end();
  }
}
