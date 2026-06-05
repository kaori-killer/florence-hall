import { beforeEach, describe, expect, it } from "vitest";
import { createPerformance, createUser, resetDb } from "@/test/fixtures";
import type { SeatCoord } from "@/lib/venue";
import { TOTAL_SEATS } from "@/lib/venue";
import { bookSeats } from "./bookings";
import {
  dailyBookings,
  performanceOccupancy,
  topSpenders,
} from "./stats";

const seat = (section: "A" | "B", row: "1" | "2" | "3", n: number): SeatCoord => ({
  section,
  row_label: row,
  seat_number: n,
});

beforeEach(async () => {
  await resetDb();
});

describe("performanceOccupancy", () => {
  it("좌석 점유율을 퍼센트로 계산한다", async () => {
    const userId = await createUser();
    const performanceId = await createPerformance();

    await bookSeats({
      userId,
      performanceId,
      seats: [seat("A", "1", 1), seat("A", "1", 2)],
    });

    const rows = await performanceOccupancy();
    const target = rows.find((r) => r.performance_id === performanceId);
    expect(target).toBeDefined();
    expect(target!.total_seats).toBe(TOTAL_SEATS);
    expect(target!.booked_seats).toBe(2);
    expect(target!.occupancy_pct).toBeCloseTo((2 / TOTAL_SEATS) * 100, 1);
  });
});

describe("topSpenders", () => {
  it("가장 많이 결제한 사용자 순으로 정렬한다", async () => {
    const big = await createUser("큰손");
    const small = await createUser("작은손");
    const aId = await createPerformance(10000);
    const bId = await createPerformance(10000);

    await bookSeats({
      userId: big,
      performanceId: aId,
      seats: [seat("A", "1", 1), seat("A", "1", 2), seat("A", "1", 3)],
    });
    await bookSeats({
      userId: small,
      performanceId: bId,
      seats: [seat("A", "1", 1)],
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
    const performanceId = await createPerformance();
    await bookSeats({
      userId,
      performanceId,
      seats: [seat("A", "1", 1)],
    });

    const rows = await dailyBookings(7);
    expect(rows.length).toBeGreaterThanOrEqual(1);
    const total = rows.reduce((sum, r) => sum + r.booking_count, 0);
    expect(total).toBeGreaterThanOrEqual(1);
  });
});
