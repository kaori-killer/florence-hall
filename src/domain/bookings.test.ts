import { beforeEach, describe, expect, it } from "vitest";
import {
  createPerformance,
  createUser,
  resetDb,
} from "@/test/fixtures";
import type { SeatCoord } from "@/lib/venue";
import {
  BookingConflictError,
  bookSeats,
  cancelBookingGroup,
  listBookingGroupsForUser,
} from "./bookings";

const A1_1: SeatCoord = { section: "A", row_label: "1", seat_number: 1 };
const A1_2: SeatCoord = { section: "A", row_label: "1", seat_number: 2 };

beforeEach(async () => {
  await resetDb();
});

describe("bookSeats", () => {
  it("선택한 좌석 수 × 가격으로 총액을 기록한다", async () => {
    const userId = await createUser();
    const performanceId = await createPerformance(5000);

    const result = await bookSeats({
      userId,
      performanceId,
      seats: [A1_1, A1_2],
    });

    expect(result.totalAmount).toBe(10000);

    const groups = await listBookingGroupsForUser(userId);
    expect(groups).toHaveLength(1);
    expect(groups[0].seats).toHaveLength(2);
    expect(groups[0].status).toBe("CONFIRMED");
  });

  it("이미 예매된 좌석이 포함되면 BookingConflictError 를 던진다", async () => {
    const userA = await createUser("A");
    const userB = await createUser("B");
    const performanceId = await createPerformance();

    await bookSeats({ userId: userA, performanceId, seats: [A1_1] });

    await expect(
      bookSeats({ userId: userB, performanceId, seats: [A1_1] }),
    ).rejects.toBeInstanceOf(BookingConflictError);
  });

  it("두 사용자가 동시에 같은 좌석을 잡으면 한쪽만 성공한다", async () => {
    const userA = await createUser("A");
    const userB = await createUser("B");
    const performanceId = await createPerformance();

    const [resultA, resultB] = await Promise.allSettled([
      bookSeats({ userId: userA, performanceId, seats: [A1_1] }),
      bookSeats({ userId: userB, performanceId, seats: [A1_1] }),
    ]);

    const fulfilled = [resultA, resultB].filter((r) => r.status === "fulfilled");
    const rejected = [resultA, resultB].filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
  });

  it("빈 좌석 배열로 호출하면 에러를 던진다", async () => {
    const userId = await createUser();
    const performanceId = await createPerformance();
    await expect(
      bookSeats({ userId, performanceId, seats: [] }),
    ).rejects.toThrow();
  });

  it("존재하지 않는 공연 id로 예매하면 에러를 던진다", async () => {
    const userId = await createUser();
    await expect(
      bookSeats({ userId, performanceId: 99999, seats: [A1_1] }),
    ).rejects.toThrow();
  });
});

describe("cancelBookingGroup", () => {
  it("취소하면 좌석이 다시 예매 가능해진다", async () => {
    const userA = await createUser("A");
    const userB = await createUser("B");
    const performanceId = await createPerformance();

    const { bookingGroupId } = await bookSeats({
      userId: userA,
      performanceId,
      seats: [A1_1],
    });
    await cancelBookingGroup({ userId: userA, bookingGroupId });

    await expect(
      bookSeats({ userId: userB, performanceId, seats: [A1_1] }),
    ).resolves.toBeDefined();
  });

  it("남의 예매는 취소할 수 없다", async () => {
    const userA = await createUser("A");
    const userB = await createUser("B");
    const performanceId = await createPerformance();
    const { bookingGroupId } = await bookSeats({
      userId: userA,
      performanceId,
      seats: [A1_1],
    });
    await expect(
      cancelBookingGroup({ userId: userB, bookingGroupId }),
    ).rejects.toThrow();
  });
});
