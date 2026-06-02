"use client";

import { useTransition } from "react";
import { cancelBookingAction } from "@/app/bookings/actions";

export function CancelButton({ bookingId }: { bookingId: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      action={(formData) => {
        startTransition(() => cancelBookingAction(formData));
      }}
    >
      <input type="hidden" name="bookingId" value={bookingId} />
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        data-testid={`cancel-${bookingId}`}
        className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-foreground-2 transition hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50"
      >
        {pending ? "취소 중..." : "예매 취소"}
      </button>
    </form>
  );
}
