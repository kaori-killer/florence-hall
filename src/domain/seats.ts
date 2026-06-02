import { query } from "@/lib/db";

export type SeatWithStatus = {
  id: number;
  section: string;
  row_label: string;
  seat_number: number;
  is_booked: boolean;
};

export function listSeatsForPerformance(
  performanceId: number,
): Promise<SeatWithStatus[]> {
  return query<SeatWithStatus>(
    `
    SELECT s.id, s.section, s.row_label, s.seat_number,
           (bs.seat_id IS NOT NULL) AS is_booked
    FROM seats s
    LEFT JOIN booking_seats bs ON bs.seat_id = s.id
    WHERE s.performance_id = $1
    ORDER BY s.section, s.row_label, s.seat_number
    `,
    [performanceId],
  );
}
