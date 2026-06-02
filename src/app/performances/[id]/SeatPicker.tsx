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

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <Stage />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
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
        <div className="mt-6 border-t border-neutral-100 pt-4">
          <SeatLegend />
        </div>
      </div>

      <SummaryBar
        count={selected.size}
        total={total}
        pending={pending}
        isLoggedIn={isLoggedIn}
        error={state.error}
      />
    </form>
  );
}

function Stage() {
  return (
    <div className="space-y-2 text-center">
      <div className="mx-auto h-1.5 w-2/3 rounded-full bg-gradient-to-r from-accent via-fuchsia-500 to-accent" />
      <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
        STAGE
      </span>
    </div>
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
    <div className="rounded-xl bg-neutral-50/70 p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        섹션 {section}
      </h3>
      <div className="space-y-1.5">
        {Array.from(rows.entries()).map(([row, rowSeats]) => (
          <div key={row} className="flex items-center gap-1.5">
            <span className="w-4 text-[10px] font-medium text-neutral-400">
              {row}
            </span>
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
  const base =
    "h-9 w-9 rounded-lg text-xs font-medium transition active:scale-95";
  const variantClass: Record<"booked" | "selected" | "available", string> = {
    booked:
      "cursor-not-allowed border border-neutral-200 bg-neutral-200 text-neutral-400",
    selected:
      "border border-accent bg-accent text-white shadow-sm shadow-accent/30 ring-2 ring-accent/20",
    available:
      "border border-neutral-300 bg-white text-neutral-700 hover:border-accent hover:text-accent",
  };
  const variant = seat.is_booked
    ? "booked"
    : isSelected
      ? "selected"
      : "available";
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
      className={`${base} ${variantClass[variant]}`}
      aria-label={`${seat.section}${seat.row_label}-${seat.seat_number}`}
    >
      {seat.seat_number}
    </button>
  );
}

function SeatLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600">
      <Swatch
        className="border border-neutral-300 bg-white"
        label="예매 가능"
      />
      <Swatch className="border border-accent bg-accent" label="선택" />
      <Swatch className="border border-neutral-200 bg-neutral-200" label="예매됨" />
    </div>
  );
}

function Swatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`inline-block h-4 w-4 rounded ${className}`} />
      {label}
    </span>
  );
}

function SummaryBar({
  count,
  total,
  pending,
  isLoggedIn,
  error,
}: {
  count: number;
  total: number;
  pending: boolean;
  isLoggedIn: boolean;
  error: string | undefined;
}) {
  const buttonLabel = !isLoggedIn
    ? "로그인 후 예매"
    : pending
      ? "예매 중..."
      : count === 0
        ? "좌석을 선택하세요"
        : `${count}석 예매하기`;

  return (
    <div className="sticky bottom-4 rounded-2xl border border-neutral-200 bg-white/95 p-4 shadow-lg backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div data-testid="selection-summary">
          <p className="text-xs uppercase tracking-wider text-neutral-500">
            선택한 좌석
          </p>
          <p className="mt-0.5 text-sm text-neutral-700">
            <strong className="text-lg text-neutral-900" data-testid="selected-count">
              {count}
            </strong>
            석{"  ·  "}
            <strong className="text-lg text-neutral-900" data-testid="selected-total">
              ₩{total.toLocaleString("ko-KR")}
            </strong>
          </p>
        </div>
        <button
          type="submit"
          disabled={pending || count === 0 || !isLoggedIn}
          data-testid="book-button"
          className="inline-flex min-w-[160px] items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500 disabled:shadow-none"
        >
          {buttonLabel}
        </button>
      </div>
      {error && (
        <p
          role="alert"
          data-testid="booking-error"
          className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}
