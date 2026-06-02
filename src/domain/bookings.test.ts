import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "@/lib/db";
import {
  createPerformanceWithSeats,
  createUser,
  resetDb,
} from "@/test/fixtures";
import {
  BookingConflictError,
  bookSeats,
  cancelBooking,
  listBookingsForUser,
} from "./bookings";

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await pool.end();
});

describe("bookSeats", () => {
  it("선택한 좌석을 예매하고 총액을 좌석 수 × 가격으로 기록한다", async () => {
    const userId = await createUser();
    const { performanceId, seatIds } = await createPerformanceWithSeats(4, 5000);

    const result = await bookSeats({
      userId,
      performanceId,
      seatIds: seatIds.slice(0, 2),
    });

    expect(result.totalAmount).toBe(10000);

    const bookings = await listBookingsForUser(userId);
    expect(bookings).toHaveLength(1);
    expect(bookings[0].seats).toHaveLength(2);
  });

  it("이미 예매된 좌석이 포함되면 BookingConflictError 를 던진다", async () => {
    const userA = await createUser("A");
    const userB = await createUser("B");
    const { performanceId, seatIds } = await createPerformanceWithSeats(2);

    await bookSeats({ userId: userA, performanceId, seatIds: [seatIds[0]] });

    await expect(
      bookSeats({ userId: userB, performanceId, seatIds: [seatIds[0]] }),
    ).rejects.toBeInstanceOf(BookingConflictError);
  });

  it("두 사용자가 동시에 같은 좌석을 잡으면 한쪽만 성공한다", async () => {
    const userA = await createUser("A");
    const userB = await createUser("B");
    const { performanceId, seatIds } = await createPerformanceWithSeats(1);

    const [resultA, resultB] = await Promise.allSettled([
      bookSeats({ userId: userA, performanceId, seatIds: [seatIds[0]] }),
      bookSeats({ userId: userB, performanceId, seatIds: [seatIds[0]] }),
    ]);

    const fulfilled = [resultA, resultB].filter((r) => r.status === "fulfilled");
    const rejected = [resultA, resultB].filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
  });

  it("다른 공연의 좌석을 섞어서 보내면 에러를 던진다", async () => {
    const userId = await createUser();
    const a = await createPerformanceWithSeats(2);
    const b = await createPerformanceWithSeats(2);

    await expect(
      bookSeats({
        userId,
        performanceId: a.performanceId,
        seatIds: [a.seatIds[0], b.seatIds[0]],
      }),
    ).rejects.toThrow();
  });

  it("빈 좌석 배열로 호출하면 에러를 던진다", async () => {
    const userId = await createUser();
    const { performanceId } = await createPerformanceWithSeats(1);
    await expect(
      bookSeats({ userId, performanceId, seatIds: [] }),
    ).rejects.toThrow();
  });
});

describe("cancelBooking", () => {
  it("취소하면 좌석이 다시 예매 가능해진다", async () => {
    const userA = await createUser("A");
    const userB = await createUser("B");
    const { performanceId, seatIds } = await createPerformanceWithSeats(1);

    const { bookingId } = await bookSeats({
      userId: userA,
      performanceId,
      seatIds: [seatIds[0]],
    });
    await cancelBooking({ userId: userA, bookingId });

    await expect(
      bookSeats({ userId: userB, performanceId, seatIds: [seatIds[0]] }),
    ).resolves.toBeDefined();
  });

  it("남의 예매는 취소할 수 없다", async () => {
    const userA = await createUser("A");
    const userB = await createUser("B");
    const { performanceId, seatIds } = await createPerformanceWithSeats(1);
    const { bookingId } = await bookSeats({
      userId: userA,
      performanceId,
      seatIds: [seatIds[0]],
    });
    await expect(
      cancelBooking({ userId: userB, bookingId }),
    ).rejects.toThrow();
  });
});
