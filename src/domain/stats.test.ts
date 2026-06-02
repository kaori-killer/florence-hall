import { beforeEach, describe, expect, it } from "vitest";
import {
  createPerformanceWithSeats,
  createUser,
  resetDb,
} from "@/test/fixtures";
import { bookSeats } from "./bookings";
import {
  dailyBookings,
  performanceOccupancy,
  topSpenders,
} from "./stats";

beforeEach(async () => {
  await resetDb();
});

describe("performanceOccupancy", () => {
  it("좌석 점유율을 퍼센트로 계산한다", async () => {
    const userId = await createUser();
    const { performanceId, seatIds } = await createPerformanceWithSeats(4);

    await bookSeats({
      userId,
      performanceId,
      seatIds: [seatIds[0], seatIds[1]],
    });

    const rows = await performanceOccupancy();
    const target = rows.find((r) => r.performance_id === performanceId);
    expect(target).toBeDefined();
    expect(target!.total_seats).toBe(4);
    expect(target!.booked_seats).toBe(2);
    expect(Number(target!.occupancy_pct)).toBe(50);
  });
});

describe("topSpenders", () => {
  it("가장 많이 결제한 사용자 순으로 정렬한다", async () => {
    const big = await createUser("큰손");
    const small = await createUser("작은손");
    const a = await createPerformanceWithSeats(5, 10000);
    const b = await createPerformanceWithSeats(5, 10000);

    await bookSeats({
      userId: big,
      performanceId: a.performanceId,
      seatIds: a.seatIds.slice(0, 3),
    });
    await bookSeats({
      userId: small,
      performanceId: b.performanceId,
      seatIds: [b.seatIds[0]],
    });

    const rows = await topSpenders(5);
    expect(rows[0].user_id).toBe(big);
    expect(rows[0].total_spent).toBe(30000);
    expect(rows[1].user_id).toBe(small);
    expect(rows[1].total_spent).toBe(10000);
  });
});

describe("dailyBookings", () => {
  it("최근 N일 안의 예매 건수를 일자별로 모은다", async () => {
    const userId = await createUser();
    const { performanceId, seatIds } = await createPerformanceWithSeats(3);
    await bookSeats({
      userId,
      performanceId,
      seatIds: [seatIds[0]],
    });

    const rows = await dailyBookings(7);
    expect(rows.length).toBeGreaterThanOrEqual(1);
    const total = rows.reduce((sum, r) => sum + r.booking_count, 0);
    expect(total).toBeGreaterThanOrEqual(1);
  });
});
