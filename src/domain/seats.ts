import { query } from "@/lib/db";
import { allSeats, type SeatCoord } from "@/lib/venue";

export type SeatWithStatus = SeatCoord & {
  is_booked: boolean;
};

/**
 * 좌석 마스터는 venue 상수에서 가져오고, 예매된 좌석만 DB에서 확인한다.
 */
export async function listSeatsForPerformance(
  performanceId: number,
): Promise<SeatWithStatus[]> {
  const booked = await query<SeatCoord>(
    `SELECT section, row_label, seat_number
       FROM bookings
      WHERE performance_id = $1 AND status = 'CONFIRMED'`,
    [performanceId],
  );

  const bookedKeys = new Set(
    booked.map((b) => `${b.section}-${b.row_label}-${b.seat_number}`),
  );

  return allSeats().map((seat) => ({
    ...seat,
    is_booked: bookedKeys.has(
      `${seat.section}-${seat.row_label}-${seat.seat_number}`,
    ),
  }));
}
