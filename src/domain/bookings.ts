import { query, withTransaction } from "@/lib/db";
import type { SeatCoord } from "@/lib/venue";

export class BookingConflictError extends Error {
  constructor(public conflicts: SeatCoord[]) {
    super("선택한 좌석 중 이미 예매된 좌석이 있습니다.");
    this.name = "BookingConflictError";
  }
}

export type BookingStatus = "CONFIRMED" | "CANCELLED";

export type BookingGroup = {
  booking_group_id: string;
  performance_id: number;
  title: string;
  artist: string;
  performed_at: string;
  status: BookingStatus;
  total_amount: number;
  created_at: string;
  seats: SeatCoord[];
};

/**
 * 예매 트랜잭션:
 *  1) 같은 performance_id 의 활성 예매 행들을 잠근다 (FOR UPDATE).
 *     - 잠금이 없으면 두 트랜잭션이 동시에 partial UNIQUE 통과를 시도해 한쪽이 늦게 실패하는 경합이 생긴다.
 *  2) 선택한 좌석 중 이미 활성으로 잡힌 게 있으면 BookingConflictError.
 *  3) booking_group_id 시퀀스에서 새 값을 받아 좌석마다 한 행씩 INSERT.
 *     partial UNIQUE 가 어떤 경로로든 중복이 들어오는 걸 막아주는 안전망이다.
 */
export async function bookSeats(input: {
  userId: number;
  performanceId: number;
  seats: SeatCoord[];
}): Promise<{ bookingGroupId: string; totalAmount: number }> {
  if (input.seats.length === 0) throw new Error("좌석을 1개 이상 선택해야 합니다.");

  return withTransaction(async (client) => {
    const priceRow = await client.query<{ price: number }>(
      "SELECT price FROM performances WHERE id = $1",
      [input.performanceId],
    );
    if (priceRow.rowCount === 0) {
      throw new Error("존재하지 않는 공연입니다.");
    }
    const price = priceRow.rows[0].price;

    const booked = await client.query<SeatCoord>(
      `SELECT section, row_label, seat_number
         FROM bookings
        WHERE performance_id = $1 AND status = 'CONFIRMED'
        FOR UPDATE`,
      [input.performanceId],
    );
    const bookedSet = new Set(
      booked.rows.map((b) => `${b.section}-${b.row_label}-${b.seat_number}`),
    );
    const conflicts = input.seats.filter((s) =>
      bookedSet.has(`${s.section}-${s.row_label}-${s.seat_number}`),
    );
    if (conflicts.length > 0) throw new BookingConflictError(conflicts);

    const groupRow = await client.query<{ gid: string }>(
      "SELECT nextval('booking_group_id_seq')::text AS gid",
    );
    const bookingGroupId = groupRow.rows[0].gid;

    const sections = input.seats.map((s) => s.section);
    const rows = input.seats.map((s) => s.row_label);
    const numbers = input.seats.map((s) => s.seat_number);

    await client.query(
      `INSERT INTO bookings
         (booking_group_id, user_id, performance_id, section, row_label, seat_number, price_paid)
       SELECT $1, $2, $3, s.section, s.row_label, s.seat_number, $4
         FROM UNNEST($5::text[], $6::text[], $7::int[]) AS s(section, row_label, seat_number)`,
      [
        bookingGroupId,
        input.userId,
        input.performanceId,
        price,
        sections,
        rows,
        numbers,
      ],
    );

    return { bookingGroupId, totalAmount: price * input.seats.length };
  });
}

/**
 * booking_group 단위로 취소한다. 본인이 만든 그룹이 아니면 거부.
 */
export async function cancelBookingGroup(input: {
  userId: number;
  bookingGroupId: string;
}): Promise<void> {
  await withTransaction(async (client) => {
    const owned = await client.query<{ id: number; status: string }>(
      `SELECT id, status FROM bookings
        WHERE booking_group_id = $1 AND user_id = $2
        FOR UPDATE`,
      [input.bookingGroupId, input.userId],
    );
    if (owned.rowCount === 0) {
      throw new Error("예매를 찾을 수 없습니다.");
    }
    await client.query(
      `UPDATE bookings SET status = 'CANCELLED'
        WHERE booking_group_id = $1 AND status = 'CONFIRMED'`,
      [input.bookingGroupId],
    );
  });
}

export function listBookingGroupsForUser(
  userId: number,
): Promise<BookingGroup[]> {
  return query<BookingGroup>(
    `
    SELECT b.booking_group_id::text AS booking_group_id,
           b.performance_id,
           p.title, p.artist, p.performed_at,
           MAX(b.status::text)::booking_status AS status,
           SUM(b.price_paid)::int AS total_amount,
           MIN(b.created_at)::text AS created_at,
           json_agg(json_build_object(
             'section', b.section,
             'row_label', b.row_label,
             'seat_number', b.seat_number
           ) ORDER BY b.section, b.row_label, b.seat_number) AS seats
      FROM bookings b
      JOIN performances p ON p.id = b.performance_id
     WHERE b.user_id = $1
     GROUP BY b.booking_group_id, b.performance_id, p.title, p.artist, p.performed_at
     ORDER BY MIN(b.created_at) DESC
    `,
    [userId],
  );
}
