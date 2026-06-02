import Link from "next/link";
import { redirect } from "next/navigation";
import {
  listBookingsForUser,
  type BookingStatus,
  type BookingWithDetails,
} from "@/domain/bookings";
import { formatKoreanDateTime } from "@/lib/format";
import { getSession } from "@/lib/session";
import { PageHeader } from "../components/PageHeader";
import { CancelButton } from "./CancelButton";

export default async function MyPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const bookings = await listBookingsForUser(session.userId);

  return (
    <section className="space-y-8">
      <PageHeader
        badge="MY"
        title="내 예매"
        description={`${session.name}님이 진행한 예매 내역입니다.`}
      />

      {bookings.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-3" data-testid="my-bookings">
          {bookings.map((b) => (
            <li key={b.id}>
              <BookingItem booking={b} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function BookingItem({ booking }: { booking: BookingWithDetails }) {
  return (
    <article
      data-testid={`booking-${booking.id}`}
      data-status={booking.status}
      className="rounded-2xl border border-line bg-surface p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <h2 className="text-base font-bold tracking-tight text-foreground">
            {booking.title}
          </h2>
          <p className="text-sm text-foreground-2">
            {booking.artist} · {formatKoreanDateTime(booking.performed_at)}
          </p>
          <p className="text-sm text-foreground-2">
            좌석{" "}
            <span className="font-medium text-foreground">
              {booking.seats
                .map((s) => `${s.section}${s.row_label}-${s.seat_number}`)
                .join(", ") || "(취소됨)"}
            </span>
          </p>
          <p className="text-sm font-bold text-foreground">
            ₩{booking.total_amount.toLocaleString("ko-KR")}
          </p>
        </div>
        <div className="flex flex-row items-center gap-2 sm:flex-col sm:items-end">
          <StatusBadge status={booking.status} />
          {booking.status === "CONFIRMED" && (
            <CancelButton bookingId={booking.id} />
          )}
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const config: Record<BookingStatus, { label: string; cls: string }> = {
    CONFIRMED: {
      label: "예매 완료",
      cls: "bg-accent-soft text-accent",
    },
    CANCELLED: {
      label: "취소됨",
      cls: "bg-background text-muted",
    },
  };
  const { label, cls } = config[status];
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
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
