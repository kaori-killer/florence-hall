import Link from "next/link";
import { redirect } from "next/navigation";
import { listBookingsForUser } from "@/domain/bookings";
import { formatKoreanDateTime } from "@/lib/format";
import { getSession } from "@/lib/session";
import { CancelButton } from "./CancelButton";

export default async function MyPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const bookings = await listBookingsForUser(session.userId);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">내 예매</h1>
        <p className="text-sm text-neutral-600 mt-1">
          {session.name}님이 진행한 예매 내역입니다.
        </p>
      </header>

      {bookings.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-3" data-testid="my-bookings">
          {bookings.map((b) => (
            <li
              key={b.id}
              data-testid={`booking-${b.id}`}
              data-status={b.status}
              className="rounded-lg border bg-white p-4 flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <h2 className="font-medium">{b.title}</h2>
                <p className="text-sm text-neutral-600">
                  {b.artist} · {formatKoreanDateTime(b.performed_at)}
                </p>
                <p className="text-sm text-neutral-500">
                  좌석{" "}
                  {b.seats
                    .map((s) => `${s.section}${s.row_label}-${s.seat_number}`)
                    .join(", ") || "(취소됨)"}
                </p>
                <p className="text-sm">
                  결제 ₩{b.total_amount.toLocaleString("ko-KR")}
                </p>
              </div>
              <div className="text-right space-y-2">
                <StatusBadge status={b.status} />
                {b.status === "CONFIRMED" && (
                  <CancelButton bookingId={b.id} />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: "CONFIRMED" | "CANCELLED" }) {
  const label = status === "CONFIRMED" ? "예매 완료" : "취소됨";
  const cls =
    status === "CONFIRMED"
      ? "bg-green-100 text-green-700"
      : "bg-neutral-200 text-neutral-600";
  return <span className={`text-xs rounded px-2 py-0.5 ${cls}`}>{label}</span>;
}

function EmptyState() {
  return (
    <div className="rounded border border-dashed bg-white p-8 text-center text-sm text-neutral-600">
      아직 예매가 없습니다.{" "}
      <Link href="/" className="underline">
        공연 보러 가기
      </Link>
    </div>
  );
}
