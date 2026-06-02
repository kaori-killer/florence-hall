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
      <header className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
            {formatKoreanDateTime(performance.performed_at)}
          </span>
          <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-foreground-2">
            잔여 {remaining}석
          </span>
        </div>
        <h1 className="mt-4 text-[28px] font-bold tracking-tight text-foreground sm:text-[32px]">
          {performance.title}
        </h1>
        <p className="mt-1 text-sm font-medium text-foreground-2">
          {performance.artist}
        </p>
        {performance.description && (
          <p className="mt-4 text-sm leading-relaxed text-foreground-2">
            {performance.description}
          </p>
        )}
        <p className="mt-6 text-sm text-foreground-2">
          좌석당{" "}
          <strong className="text-base font-bold text-foreground">
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
