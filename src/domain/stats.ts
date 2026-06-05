import { query } from "@/lib/db";
import { TOTAL_SEATS } from "@/lib/venue";

export type OccupancyRow = {
  performance_id: number;
  title: string;
  total_seats: number;
  booked_seats: number;
  occupancy_pct: number;
};

export async function performanceOccupancy(): Promise<OccupancyRow[]> {
  const rows = await query<{
    performance_id: number;
    title: string;
    booked_seats: number;
  }>(`
    SELECT p.id AS performance_id, p.title,
           COUNT(b.id) FILTER (WHERE b.status = 'CONFIRMED')::int AS booked_seats
    FROM performances p
    LEFT JOIN bookings b ON b.performance_id = p.id
    GROUP BY p.id
    ORDER BY p.title
  `);

  return rows
    .map((row) => ({
      performance_id: row.performance_id,
      title: row.title,
      total_seats: TOTAL_SEATS,
      booked_seats: row.booked_seats,
      occupancy_pct:
        TOTAL_SEATS === 0
          ? 0
          : Math.round((row.booked_seats / TOTAL_SEATS) * 1000) / 10,
    }))
    .sort((a, b) => b.occupancy_pct - a.occupancy_pct);
}

export type TopSpenderRow = {
  user_id: number;
  name: string;
  total_spent: number;
  booking_count: number;
};

export function topSpenders(limit = 5): Promise<TopSpenderRow[]> {
  return query<TopSpenderRow>(
    `
    SELECT u.id AS user_id, u.name,
           SUM(b.price_paid)::int AS total_spent,
           COUNT(DISTINCT b.booking_group_id)::int AS booking_count
    FROM users u
    JOIN bookings b ON b.user_id = u.id AND b.status = 'CONFIRMED'
    GROUP BY u.id
    ORDER BY total_spent DESC
    LIMIT $1
    `,
    [limit],
  );
}

export type DailyBookingRow = { day: string; booking_count: number };

export function dailyBookings(days = 14): Promise<DailyBookingRow[]> {
  return query<DailyBookingRow>(
    `
    SELECT TO_CHAR(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
           COUNT(DISTINCT booking_group_id)::int AS booking_count
    FROM bookings
    WHERE status = 'CONFIRMED' AND created_at >= NOW() - ($1::int || ' days')::interval
    GROUP BY day
    ORDER BY day
    `,
    [days],
  );
}
