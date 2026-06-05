import Image from "next/image";
import Link from "next/link";
import {
  listPerformances,
  type PerformanceWithRemaining,
} from "@/domain/performances";
import { formatKoreanDateTime } from "@/lib/format";
import { PageHeader } from "./components/PageHeader";

export default async function PerformancesPage() {
  const performances = await listPerformances();
  return (
    <section className="space-y-8">
      <PageHeader
        badge="지금 예매 가능"
        title="오늘 어떤 공연 보러 가세요?"
        description="좌석을 누르면 트랜잭션으로 즉시 예매됩니다. 같은 좌석을 동시에 누른 두 사람 중에는 한 명만 성공해요."
      />
      <ul className="grid gap-4 sm:grid-cols-2" data-testid="performance-list">
        {performances.map((p) => (
          <li key={p.id}>
            <PerformanceCard performance={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function PerformanceCard({ performance }: { performance: PerformanceWithRemaining }) {
  const soldOut = performance.remaining === 0;
  const booked = performance.total_seats - performance.remaining;
  const occupancy =
    performance.total_seats > 0
      ? Math.round((booked / performance.total_seats) * 100)
      : 0;

  return (
    <Link
      href={`/performances/${performance.id}`}
      data-testid={`performance-card-${performance.id}`}
      className="group block overflow-hidden rounded-2xl border border-line bg-surface transition hover:border-accent/40 hover:-translate-y-0.5"
    >
      <PerformanceCover
        src={performance.image_url}
        title={performance.title}
        soldOut={soldOut}
      />
      <div className="space-y-4 p-5">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-accent">
            {formatKoreanDateTime(performance.performed_at)}
          </p>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            {performance.title}
          </h2>
          <p className="text-sm text-foreground-2">{performance.artist}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted">
            <span data-testid={`remaining-${performance.id}`}>
              잔여 {performance.remaining} / {performance.total_seats}석
            </span>
            <span className="font-semibold text-foreground-2">
              {occupancy}% 매진
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-line">
            <div
              className={`h-full rounded-full ${soldOut ? "bg-muted" : "bg-accent"}`}
              style={{ width: `${occupancy}%` }}
              aria-hidden
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xl font-bold text-foreground">
            ₩{performance.price.toLocaleString("ko-KR")}
          </span>
          <span className="text-sm font-semibold text-accent transition group-hover:translate-x-0.5">
            좌석 보기 →
          </span>
        </div>
      </div>
    </Link>
  );
}

function PerformanceCover({
  src,
  title,
  soldOut,
}: {
  src: string | null;
  title: string;
  soldOut: boolean;
}) {
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden bg-background">
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="(min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-muted">
          {title}
        </div>
      )}
      {soldOut && (
        <div className="absolute inset-0 flex items-center justify-center bg-foreground/50">
          <span className="rounded-full bg-surface px-4 py-1.5 text-xs font-bold text-foreground">
            매진
          </span>
        </div>
      )}
    </div>
  );
}
