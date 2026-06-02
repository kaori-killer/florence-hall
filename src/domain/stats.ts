import { query } from "@/lib/db";

export type OccupancyRow = {
  performance_id: number;
  title: string;
  total_seats: number;
  booked_seats: number;
  occupancy_pct: number;
};

export function performanceOccupancy(): Promise<OccupancyRow[]> {
  return query<OccupancyRow>(`
    SELECT p.id AS performance_id, p.title,
           COUNT(s.id)::int AS total_seats,
           COUNT(bs.seat_id)::int AS booked_seats,
           ROUND(COUNT(bs.seat_id)::numeric / NULLIF(COUNT(s.id), 0) * 100, 1)
             AS occupancy_pct
    FROM performances p
    LEFT JOIN seats s ON s.performance_id = p.id
    LEFT JOIN booking_seats bs ON bs.seat_id = s.id
    GROUP BY p.id
    ORDER BY occupancy_pct DESC NULLS LAST, p.title
  `);
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
           SUM(b.total_amount)::int AS total_spent,
           COUNT(b.id)::int AS booking_count
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
           COUNT(*)::int AS booking_count
    FROM bookings
    WHERE created_at >= NOW() - ($1::int || ' days')::interval
    GROUP BY day
    ORDER BY day
    `,
    [days],
  );
}
