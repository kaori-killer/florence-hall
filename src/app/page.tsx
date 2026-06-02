import Link from "next/link";
import {
  listPerformances,
  type PerformanceWithRemaining,
} from "@/domain/performances";
import { formatKoreanDateTime } from "@/lib/format";

export default async function PerformancesPage() {
  const performances = await listPerformances();
  return (
    <section className="space-y-8">
      <PageHero />
      <ul
        className="grid gap-5 sm:grid-cols-2"
        data-testid="performance-list"
      >
        {performances.map((p) => (
          <li key={p.id}>
            <PerformanceCard performance={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function PageHero() {
  return (
    <header className="space-y-3">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        지금 예매 가능
      </span>
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
        오늘 어떤 공연 보러 가세요?
      </h1>
      <p className="max-w-xl text-sm text-neutral-600">
        좌석을 누르면 트랜잭션으로 즉시 예매됩니다. 같은 좌석을 동시에 누른
        두 사람 중에는 한 명만 성공해요.
      </p>
    </header>
  );
}

function PerformanceCard({ performance }: { performance: PerformanceWithRemaining }) {
  const soldOut = performance.remaining === 0;
  const occupancy =
    performance.total_seats > 0
      ? Math.round(
          ((performance.total_seats - performance.remaining) /
            performance.total_seats) *
            100,
        )
      : 0;

  return (
    <Link
      href={`/performances/${performance.id}`}
      data-testid={`performance-card-${performance.id}`}
      className="group block overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="h-1.5 w-full bg-gradient-to-r from-accent to-fuchsia-500" />
      <div className="space-y-4 p-5">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-accent">
            {formatKoreanDateTime(performance.performed_at)}
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
            {performance.title}
          </h2>
          <p className="text-sm text-neutral-600">{performance.artist}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span data-testid={`remaining-${performance.id}`}>
              잔여 {performance.remaining} / {performance.total_seats}석
            </span>
            <span>{occupancy}% 매진</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className={`h-full rounded-full ${
                soldOut ? "bg-neutral-400" : "bg-accent"
              }`}
              style={{ width: `${occupancy}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-lg font-semibold text-neutral-900">
            ₩{performance.price.toLocaleString("ko-KR")}
          </span>
          {soldOut ? (
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-500">
              매진
            </span>
          ) : (
            <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent transition group-hover:bg-accent group-hover:text-white">
              좌석 보기 →
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
