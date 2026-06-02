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

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{performance.title}</h1>
        <p className="text-sm text-neutral-600 mt-1">
          {performance.artist} · {formatKoreanDateTime(performance.performed_at)}
        </p>
        <p className="text-sm text-neutral-700 mt-2">{performance.description}</p>
        <p className="text-sm mt-2">
          좌석당 <strong>₩{performance.price.toLocaleString("ko-KR")}</strong>
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
