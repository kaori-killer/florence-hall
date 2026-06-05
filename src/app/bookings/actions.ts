"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  BookingConflictError,
  bookSeats,
  cancelBookingGroup,
} from "@/domain/bookings";
import { getSession } from "@/lib/session";
import { ROW_LABELS, SECTIONS } from "@/lib/venue";

export type BookingState = { error?: string; success?: boolean };

const seatSchema = z.object({
  section: z.enum(SECTIONS),
  row_label: z.enum(ROW_LABELS),
  seat_number: z.coerce.number().int().positive(),
});

const bookSchema = z.object({
  performanceId: z.coerce.number().int().positive(),
  seats: z.array(seatSchema).min(1, "좌석을 1개 이상 선택하세요."),
});

export async function bookSeatsAction(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const session = await getSession();
  if (!session) return { error: "로그인이 필요합니다." };

  const rawSeats = formData
    .getAll("seats")
    .map((value) => {
      try {
        return JSON.parse(String(value));
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const parsed = bookSchema.safeParse({
    performanceId: formData.get("performanceId"),
    seats: rawSeats,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "잘못된 요청입니다." };
  }

  try {
    await bookSeats({
      userId: session.userId,
      performanceId: parsed.data.performanceId,
      seats: parsed.data.seats,
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
  const bookingGroupId = String(formData.get("bookingGroupId") ?? "");
  if (!bookingGroupId) return;
  await cancelBookingGroup({ userId: session.userId, bookingGroupId });
  revalidatePath("/my");
  revalidatePath("/");
}
