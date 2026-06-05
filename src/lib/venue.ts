/**
 * Florence Hall 공연장은 모든 공연에서 같은 좌석 배치를 쓴다.
 * 좌석 마스터를 DB에 두지 않고 코드 상수로 두면 테이블 하나(seats)를 줄일 수 있다.
 */
export const SECTIONS = ["A", "B"] as const;
export const ROW_LABELS = ["1", "2", "3"] as const;
export const SEATS_PER_ROW = 5;

export const TOTAL_SEATS =
  SECTIONS.length * ROW_LABELS.length * SEATS_PER_ROW;

export type SeatCoord = {
  section: (typeof SECTIONS)[number];
  row_label: (typeof ROW_LABELS)[number];
  seat_number: number;
};

export function allSeats(): SeatCoord[] {
  const seats: SeatCoord[] = [];
  for (const section of SECTIONS) {
    for (const row_label of ROW_LABELS) {
      for (let seat_number = 1; seat_number <= SEATS_PER_ROW; seat_number++) {
        seats.push({ section, row_label, seat_number });
      }
    }
  }
  return seats;
}

export function seatKey(seat: SeatCoord): string {
  return `${seat.section}-${seat.row_label}-${seat.seat_number}`;
}
