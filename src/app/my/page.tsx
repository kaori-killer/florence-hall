import Link from "next/link";
import { redirect } from "next/navigation";
import {
  listBookingGroupsForUser,
  type BookingGroup,
  type BookingStatus,
} from "@/domain/bookings";
import { formatKoreanDateTime } from "@/lib/format";
import { getSession } from "@/lib/session";
import { Badge } from "../components/Badge";
import { PageHeader } from "../components/PageHeader";
import { CancelButton } from "./CancelButton";

export default async function MyPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const groups = await listBookingGroupsForUser(session.userId);

  return (
    <section className="space-y-8">
      <PageHeader
        badge="MY"
        title="내 예매"
        description={`${session.name}님이 진행한 예매 내역입니다.`}
      />

      {groups.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-3" data-testid="my-bookings">
          {groups.map((g) => (
            <li
              key={g.booking_group_id}
              data-testid={`booking-${g.booking_group_id}`}
              data-status={g.status}
            >
              <BookingItem group={g} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function BookingItem({ group }: { group: BookingGroup }) {
  return (
    <article className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <h2 className="text-base font-bold tracking-tight text-foreground">
            {group.title}
          </h2>
          <p className="text-sm text-foreground-2">
            {group.artist} · {formatKoreanDateTime(group.performed_at)}
          </p>
          <p className="text-sm text-foreground-2">
            좌석{" "}
            <span className="font-medium text-foreground">
              {group.seats
                .map((s) => `${s.section}${s.row_label}-${s.seat_number}`)
                .join(", ")}
            </span>
          </p>
          <p className="text-sm font-bold text-foreground">
            ₩{group.total_amount.toLocaleString("ko-KR")}
          </p>
        </div>
        <div className="flex flex-row items-center gap-2 sm:flex-col sm:items-end">
          <StatusBadge status={group.status} />
          {group.status === "CONFIRMED" && (
            <CancelButton bookingGroupId={group.booking_group_id} />
          )}
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  if (status === "CONFIRMED") return <Badge variant="accent">예매 완료</Badge>;
  return <Badge variant="muted">취소됨</Badge>;
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface p-12 text-center">
      <p className="text-sm font-medium text-foreground-2">
        아직 예매가 없습니다.
      </p>
      <Link
        href="/"
        className="mt-3 inline-flex rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-white hover:bg-foreground/90"
      >
        공연 보러 가기
      </Link>
    </div>
  );
}
