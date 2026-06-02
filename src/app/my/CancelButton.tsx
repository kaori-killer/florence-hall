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
        data-testid={`cancel-${bookingId}`}
        className="text-sm rounded border border-neutral-300 px-3 py-1 hover:border-neutral-900 disabled:opacity-50"
      >
        {pending ? "취소 중..." : "예매 취소"}
      </button>
    </form>
  );
}
