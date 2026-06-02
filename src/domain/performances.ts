import { query } from "@/lib/db";

export type Performance = {
  id: number;
  title: string;
  artist: string;
  performed_at: string;
  price: number;
  description: string;
};

export type PerformanceWithRemaining = Performance & {
  total_seats: number;
  remaining: number;
};

export function listPerformances(): Promise<PerformanceWithRemaining[]> {
  return query<PerformanceWithRemaining>(`
    SELECT p.id, p.title, p.artist, p.performed_at, p.price, p.description,
           COUNT(s.id)::int AS total_seats,
           (COUNT(s.id) - COUNT(bs.seat_id))::int AS remaining
    FROM performances p
    LEFT JOIN seats s ON s.performance_id = p.id
    LEFT JOIN booking_seats bs ON bs.seat_id = s.id
    GROUP BY p.id
    ORDER BY p.performed_at ASC
  `);
}

export async function getPerformance(id: number): Promise<Performance | null> {
  const rows = await query<Performance>(
    "SELECT id, title, artist, performed_at, price, description FROM performances WHERE id = $1",
    [id],
  );
  return rows[0] ?? null;
}
