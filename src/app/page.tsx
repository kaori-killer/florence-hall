import Link from "next/link";
import { listPerformances } from "@/domain/performances";
import { formatKoreanDateTime } from "@/lib/format";

export default async function PerformancesPage() {
  const performances = await listPerformances();
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">상영 중인 공연</h1>
        <p className="text-sm text-neutral-600 mt-1">
          좌석을 선택하면 트랜잭션으로 즉시 예매됩니다.
        </p>
      </header>
      <ul
        className="grid gap-4 sm:grid-cols-2"
        data-testid="performance-list"
      >
        {performances.map((p) => (
          <li
            key={p.id}
            className="rounded-lg border bg-white p-4 hover:shadow-sm transition"
          >
            <Link
              href={`/performances/${p.id}`}
              className="block space-y-2"
              data-testid={`performance-card-${p.id}`}
            >
              <h2 className="font-medium">{p.title}</h2>
              <p className="text-sm text-neutral-600">{p.artist}</p>
              <p className="text-sm text-neutral-500">
                {formatKoreanDateTime(p.performed_at)}
              </p>
              <div className="flex items-center justify-between pt-2 text-sm">
                <span className="font-medium">
                  ₩{p.price.toLocaleString("ko-KR")}
                </span>
                <span
                  className="text-neutral-600"
                  data-testid={`remaining-${p.id}`}
                >
                  잔여 {p.remaining} / {p.total_seats}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
