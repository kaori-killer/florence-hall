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

      <section
        aria-label="좌석 선택"
        className="rounded-2xl border border-line bg-surface p-6"
      >
        <Stage />
        <div
          role="group"
          aria-label="좌석 배치도. 좌석에서 Enter나 Space로 선택하고, 방향키로 이동할 수 있습니다."
          className="mt-8 grid gap-5 sm:grid-cols-2"
        >
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
        <div className="mt-6 border-t border-line pt-4">
          <SeatLegend />
        </div>
      </section>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {selected.size === 0
          ? "선택된 좌석이 없습니다."
          : `${selected.size}석 선택, 합계 ${total.toLocaleString("ko-KR")}원.`}
      </p>

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
      <div
        aria-hidden
        className="mx-auto h-1 w-2/3 rounded-full bg-foreground"
      />
      <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
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
    <div className="rounded-xl bg-background p-4">
      <h3 className="mb-3 text-xs font-bold tracking-wide text-foreground-2">
        섹션 {section}
      </h3>
      <div className="space-y-1.5">
        {Array.from(rows.entries()).map(([row, rowSeats]) => (
          <div key={row} className="flex items-center gap-1.5">
            <span className="w-4 text-[10px] font-semibold text-muted">
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
    "h-9 w-9 rounded-lg text-xs font-semibold transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2";
  const variantClass: Record<"booked" | "selected" | "available", string> = {
    booked:
      "cursor-not-allowed border border-line bg-line text-muted",
    selected:
      "border border-accent bg-accent text-white",
    available:
      "border border-line bg-surface text-foreground-2 hover:border-accent hover:text-accent",
  };
  const variant = seat.is_booked
    ? "booked"
    : isSelected
      ? "selected"
      : "available";
  const status = seat.is_booked ? " (예매됨)" : isSelected ? " (선택됨)" : "";

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const key = event.key;
    const directions: Record<string, "next" | "prev"> = {
      ArrowRight: "next",
      ArrowDown: "next",
      ArrowLeft: "prev",
      ArrowUp: "prev",
    };
    const direction = directions[key];
    if (!direction) return;
    event.preventDefault();
    const focusables = Array.from(
      event.currentTarget
        .closest('[role="group"]')
        ?.querySelectorAll<HTMLButtonElement>(
          'button[data-testid^="seat-"]:not([disabled])',
        ) ?? [],
    );
    const currentIndex = focusables.indexOf(event.currentTarget);
    if (currentIndex < 0) return;
    const nextIndex =
      direction === "next" ? currentIndex + 1 : currentIndex - 1;
    focusables[nextIndex]?.focus();
  }

  return (
    <button
      type="button"
      onClick={() => onToggle(seat.id, seat.is_booked)}
      onKeyDown={handleKeyDown}
      disabled={seat.is_booked}
      aria-pressed={!seat.is_booked && isSelected}
      data-testid={`seat-${seat.id}`}
      data-section={seat.section}
      data-row={seat.row_label}
      data-number={seat.seat_number}
      data-booked={seat.is_booked ? "true" : "false"}
      data-selected={isSelected ? "true" : "false"}
      className={`${base} ${variantClass[variant]}`}
      aria-label={`${seat.section} 섹션 ${seat.row_label}열 ${seat.seat_number}번 좌석${status}`}
    >
      {seat.seat_number}
    </button>
  );
}

function SeatLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-foreground-2">
      <Swatch className="border border-line bg-surface" label="예매 가능" />
      <Swatch className="border border-accent bg-accent" label="선택" />
      <Swatch className="border border-line bg-line" label="예매됨" />
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
    <div className="sticky bottom-4 rounded-2xl border border-line bg-surface p-4 shadow-[0_8px_24px_-12px_rgba(25,31,40,0.16)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div data-testid="selection-summary">
          <p className="text-xs font-semibold text-muted">선택한 좌석</p>
          <p className="mt-1 text-sm text-foreground-2">
            <strong
              className="text-xl text-foreground"
              data-testid="selected-count"
            >
              {count}
            </strong>
            석{"  ·  "}
            <strong
              className="text-xl text-foreground"
              data-testid="selected-total"
            >
              ₩{total.toLocaleString("ko-KR")}
            </strong>
          </p>
        </div>
        <button
          type="submit"
          disabled={pending || count === 0 || !isLoggedIn}
          aria-busy={pending}
          data-testid="book-button"
          className="inline-flex min-w-[160px] items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white transition hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
        >
          {buttonLabel}
        </button>
      </div>
      {error && (
        <p
          role="alert"
          data-testid="booking-error"
          className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}
