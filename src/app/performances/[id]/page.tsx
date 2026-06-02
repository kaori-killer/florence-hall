import { notFound } from "next/navigation";
import { getPerformance } from "@/domain/performances";
import { listSeatsForPerformance } from "@/domain/seats";
import { formatKoreanDateTime } from "@/lib/format";
import { getSession } from "@/lib/session";
import { SeatPicker } from "./SeatPicker";

export default async function PerformancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const performanceId = Number(id);
  if (!Number.isInteger(performanceId) || performanceId <= 0) notFound();

  const [performance, seats, session] = await Promise.all([
    getPerformance(performanceId),
    listSeatsForPerformance(performanceId),
    getSession(),
  ]);
  if (!performance) notFound();

  const remaining = seats.filter((s) => !s.is_booked).length;

  return (
    <section className="space-y-8">
      <header className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
            {formatKoreanDateTime(performance.performed_at)}
          </span>
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
            잔여 {remaining}석
          </span>
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">
          {performance.title}
        </h1>
        <p className="mt-1 text-sm text-neutral-600">{performance.artist}</p>
        {performance.description && (
          <p className="mt-3 text-sm leading-relaxed text-neutral-700">
            {performance.description}
          </p>
        )}
        <p className="mt-4 text-sm text-neutral-600">
          좌석당{" "}
          <strong className="text-base font-semibold text-neutral-900">
            ₩{performance.price.toLocaleString("ko-KR")}
          </strong>
        </p>
      </header>

      <SeatPicker
        performanceId={performance.id}
        pricePerSeat={performance.price}
        seats={seats}
        isLoggedIn={Boolean(session)}
      />
    </section>
  );
}
