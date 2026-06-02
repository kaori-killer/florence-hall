"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { bookSeatsAction, type BookingState } from "@/app/bookings/actions";
import type { SeatWithStatus } from "@/domain/seats";

type Props = {
  performanceId: number;
  pricePerSeat: number;
  seats: SeatWithStatus[];
  isLoggedIn: boolean;
};

function groupBy<T, K>(items: T[], key: (item: T) => K): Map<K, T[]> {
  const grouped = new Map<K, T[]>();
  for (const item of items) {
    const list = grouped.get(key(item)) ?? [];
    list.push(item);
    grouped.set(key(item), list);
  }
  return grouped;
}

export function SeatPicker({
  performanceId,
  pricePerSeat,
  seats,
  isLoggedIn,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [state, formAction, pending] = useActionState<BookingState, FormData>(
    async (prev, formData) => {
      const result = await bookSeatsAction(prev, formData);
      if (result.success) {
        setSelected(new Set());
        router.push("/my");
      }
      return result;
    },
    {},
  );

  function toggle(seatId: number, isBooked: boolean) {
    if (isBooked) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(seatId)) next.delete(seatId);
      else next.add(seatId);
      return next;
    });
  }

  const sections = Array.from(groupBy(seats, (s) => s.section).entries());
  const total = pricePerSeat * selected.size;

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="performanceId" value={performanceId} />
      {Array.from(selected).map((id) => (
        <input key={id} type="hidden" name="seatIds" value={id} />
      ))}

      <div className="space-y-4">
        {sections.map(([section, sectionSeats]) => (
          <SeatSection
            key={section}
            section={section}
            seats={sectionSeats}
            selected={selected}
            onToggle={toggle}
          />
        ))}
      </div>

      <SeatLegend />

      <div className="flex items-center justify-between border-t pt-4">
        <div data-testid="selection-summary">
          <span className="text-sm text-neutral-600">선택한 좌석</span>{" "}
          <strong data-testid="selected-count">{selected.size}</strong>석{" "}
          <span className="text-sm text-neutral-600">/ 합계</span>{" "}
          <strong data-testid="selected-total">
            ₩{total.toLocaleString("ko-KR")}
          </strong>
        </div>
        <button
          type="submit"
          disabled={pending || selected.size === 0 || !isLoggedIn}
          data-testid="book-button"
          className="rounded bg-neutral-900 text-white px-4 py-2 disabled:opacity-50"
        >
          {!isLoggedIn ? "로그인 후 예매" : pending ? "예매 중..." : "예매하기"}
        </button>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600" data-testid="booking-error">
          {state.error}
        </p>
      )}
    </form>
  );
}

function SeatSection({
  section,
  seats,
  selected,
  onToggle,
}: {
  section: string;
  seats: SeatWithStatus[];
  selected: Set<number>;
  onToggle: (seatId: number, isBooked: boolean) => void;
}) {
  const rows = groupBy(seats, (s) => s.row_label);
  return (
    <div className="rounded border bg-white p-3">
      <h3 className="text-sm font-medium mb-2">섹션 {section}</h3>
      <div className="space-y-1">
        {Array.from(rows.entries()).map(([row, rowSeats]) => (
          <div key={row} className="flex items-center gap-1">
            <span className="w-5 text-xs text-neutral-500">{row}</span>
            {rowSeats.map((seat) => (
              <SeatButton
                key={seat.id}
                seat={seat}
                isSelected={selected.has(seat.id)}
                onToggle={onToggle}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function SeatButton({
  seat,
  isSelected,
  onToggle,
}: {
  seat: SeatWithStatus;
  isSelected: boolean;
  onToggle: (seatId: number, isBooked: boolean) => void;
}) {
  const base = "w-8 h-8 text-xs rounded border transition";
  const variantClass: Record<"booked" | "selected" | "available", string> = {
    booked: "bg-neutral-200 text-neutral-400 cursor-not-allowed border-neutral-200",
    selected: "bg-neutral-900 text-white border-neutral-900",
    available: "bg-white text-neutral-700 border-neutral-300 hover:border-neutral-900",
  };
  const variant = seat.is_booked
    ? "booked"
    : isSelected
      ? "selected"
      : "available";
  const cls = `${base} ${variantClass[variant]}`;
  return (
    <button
      type="button"
      onClick={() => onToggle(seat.id, seat.is_booked)}
      disabled={seat.is_booked}
      data-testid={`seat-${seat.id}`}
      data-section={seat.section}
      data-row={seat.row_label}
      data-number={seat.seat_number}
      data-booked={seat.is_booked ? "true" : "false"}
      data-selected={isSelected ? "true" : "false"}
      className={cls}
      aria-label={`${seat.section}${seat.row_label}-${seat.seat_number}`}
    >
      {seat.seat_number}
    </button>
  );
}

function SeatLegend() {
  return (
    <div className="flex items-center gap-4 text-xs text-neutral-600">
      <Swatch className="bg-white border border-neutral-300" label="예매 가능" />
      <Swatch className="bg-neutral-900" label="선택" />
      <Swatch className="bg-neutral-200" label="예매됨" />
    </div>
  );
}

function Swatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block w-4 h-4 rounded ${className}`} />
      {label}
    </span>
  );
}
