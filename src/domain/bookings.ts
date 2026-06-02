import { query, withTransaction } from "@/lib/db";

export class BookingConflictError extends Error {
  constructor(public seatIds: number[]) {
    super("선택한 좌석 중 이미 예매된 좌석이 있습니다.");
    this.name = "BookingConflictError";
  }
}

export type BookingStatus = "CONFIRMED" | "CANCELLED";

export type Booking = {
  id: number;
  performance_id: number;
  status: BookingStatus;
  total_amount: number;
  created_at: string;
};

export type BookingWithDetails = Booking & {
  title: string;
  artist: string;
  performed_at: string;
  seats: { section: string; row_label: string; seat_number: number }[];
};

/**
 * 예매 트랜잭션:
 * 1. SELECT FOR UPDATE 로 선택 좌석들에 행 잠금
 * 2. 이미 booking_seats 에 들어가 있는지 확인 → 있으면 충돌
 * 3. bookings INSERT, booking_seats INSERT (UNIQUE 제약이 안전망)
 *
 * 동시에 두 트랜잭션이 같은 좌석을 잡으면, 한쪽이 1단계에서 잠금을 잡고
 * 다른 쪽은 대기하다가 2단계에서 충돌을 발견해 ROLLBACK 된다.
 */
export async function bookSeats(input: {
  userId: number;
  performanceId: number;
  seatIds: number[];
}): Promise<{ bookingId: number; totalAmount: number }> {
  if (input.seatIds.length === 0) throw new Error("좌석을 1개 이상 선택해야 합니다.");

  return withTransaction(async (client) => {
    const locked = await client.query<{
      seat_id: number;
      price: number;
      booked_seat: number | null;
    }>(
      `SELECT s.id AS seat_id, p.price, bs.seat_id AS booked_seat
         FROM seats s
         JOIN performances p ON p.id = s.performance_id
         LEFT JOIN booking_seats bs ON bs.seat_id = s.id
        WHERE s.id = ANY($1::int[]) AND s.performance_id = $2
        FOR UPDATE OF s`,
      [input.seatIds, input.performanceId],
    );
    if (locked.rowCount !== input.seatIds.length) {
      throw new Error("유효하지 않은 좌석이 포함되어 있습니다.");
    }
    const conflicts = locked.rows
      .filter((r) => r.booked_seat !== null)
      .map((r) => r.seat_id);
    if (conflicts.length > 0) throw new BookingConflictError(conflicts);

    const totalAmount = locked.rows[0].price * input.seatIds.length;

    const bookingRow = await client.query<{ id: number }>(
      `INSERT INTO bookings (user_id, performance_id, status, total_amount)
       VALUES ($1, $2, 'CONFIRMED', $3)
       RETURNING id`,
      [input.userId, input.performanceId, totalAmount],
    );
    const bookingId = bookingRow.rows[0].id;

    await client.query(
      `INSERT INTO booking_seats (booking_id, seat_id)
       SELECT $1, UNNEST($2::int[])`,
      [bookingId, input.seatIds],
    );

    return { bookingId, totalAmount };
  });
}

/**
 * 예매 취소: 상태를 CANCELLED 로 바꾸고 booking_seats 행을 제거해
 * 좌석이 다시 예매 가능해진다. 본인 예매만 취소 가능.
 */
export async function cancelBooking(input: {
  userId: number;
  bookingId: number;
}): Promise<void> {
  await withTransaction(async (client) => {
    const owned = await client.query<{ status: string }>(
      "SELECT status FROM bookings WHERE id = $1 AND user_id = $2 FOR UPDATE",
      [input.bookingId, input.userId],
    );
    const row = owned.rows[0];
    if (!row) throw new Error("예매를 찾을 수 없습니다.");
    if (row.status === "CANCELLED") return;
    await client.query(
      "UPDATE bookings SET status = 'CANCELLED' WHERE id = $1",
      [input.bookingId],
    );
    await client.query("DELETE FROM booking_seats WHERE booking_id = $1", [
      input.bookingId,
    ]);
  });
}

export function listBookingsForUser(
  userId: number,
): Promise<BookingWithDetails[]> {
  return query<BookingWithDetails>(
    `
    SELECT b.id, b.performance_id, b.status, b.total_amount, b.created_at,
           p.title, p.artist, p.performed_at,
           COALESCE(
             (SELECT json_agg(json_build_object(
                'section', s.section,
                'row_label', s.row_label,
                'seat_number', s.seat_number
              ) ORDER BY s.section, s.row_label, s.seat_number)
              FROM booking_seats bs
              JOIN seats s ON s.id = bs.seat_id
              WHERE bs.booking_id = b.id),
             '[]'::json
           ) AS seats
    FROM bookings b
    JOIN performances p ON p.id = b.performance_id
    WHERE b.user_id = $1
    ORDER BY b.created_at DESC
    `,
    [userId],
  );
}
