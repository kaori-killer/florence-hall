import { query } from "@/lib/db";
import { TOTAL_SEATS } from "@/lib/venue";

export type Performance = {
  id: number;
  title: string;
  artist: string;
  performed_at: string;
  price: number;
  description: string;
  image_url: string | null;
};

export type PerformanceWithRemaining = Performance & {
  total_seats: number;
  remaining: number;
};

/**
 * 좌석 총량은 코드 상수(TOTAL_SEATS)에서 가져오고, 점유 좌석만 DB에서 센다.
 */
export async function listPerformances(): Promise<PerformanceWithRemaining[]> {
  const rows = await query<Performance & { booked_count: number }>(`
    SELECT p.id, p.title, p.artist, p.performed_at, p.price, p.description, p.image_url,
           COUNT(b.id) FILTER (WHERE b.status = 'CONFIRMED')::int AS booked_count
    FROM performances p
    LEFT JOIN bookings b ON b.performance_id = p.id
    GROUP BY p.id
    ORDER BY p.performed_at ASC
  `);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    artist: row.artist,
    performed_at: row.performed_at,
    price: row.price,
    description: row.description,
    image_url: row.image_url,
    total_seats: TOTAL_SEATS,
    remaining: TOTAL_SEATS - row.booked_count,
  }));
}

export async function getPerformance(id: number): Promise<Performance | null> {
  const rows = await query<Performance>(
    "SELECT id, title, artist, performed_at, price, description, image_url FROM performances WHERE id = $1",
    [id],
  );
  return rows[0] ?? null;
}
