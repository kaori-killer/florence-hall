"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  BookingConflictError,
  bookSeats,
  cancelBooking,
} from "@/domain/bookings";
import { getSession } from "@/lib/session";

export type BookingState = { error?: string; success?: boolean };

const bookSchema = z.object({
  performanceId: z.coerce.number().int().positive(),
  seatIds: z.array(z.coerce.number().int().positive()).min(1, "좌석을 1개 이상 선택하세요."),
});

export async function bookSeatsAction(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const session = await getSession();
  if (!session) return { error: "로그인이 필요합니다." };

  const parsed = bookSchema.safeParse({
    performanceId: formData.get("performanceId"),
    seatIds: formData.getAll("seatIds"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "잘못된 요청입니다." };
  }

  try {
    await bookSeats({
      userId: session.userId,
      performanceId: parsed.data.performanceId,
      seatIds: parsed.data.seatIds,
    });
  } catch (err) {
    if (err instanceof BookingConflictError) {
      return { error: err.message };
    }
    return { error: err instanceof Error ? err.message : "예매에 실패했습니다." };
  }

  revalidatePath(`/performances/${parsed.data.performanceId}`);
  revalidatePath("/");
  revalidatePath("/my");
  return { success: true };
}

export async function cancelBookingAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) return;
  const bookingId = Number(formData.get("bookingId"));
  if (!Number.isInteger(bookingId) || bookingId <= 0) return;
  await cancelBooking({ userId: session.userId, bookingId });
  revalidatePath("/my");
  revalidatePath("/");
}
