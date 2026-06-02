import {
  dailyBookings,
  performanceOccupancy,
  topSpenders,
} from "@/domain/stats";
import { PageHeader } from "../components/PageHeader";

export default async function StatsPage() {
  const [occupancy, spenders, daily] = await Promise.all([
    performanceOccupancy(),
    topSpenders(5),
    dailyBookings(14),
  ]);

  return (
    <section className="space-y-8">
      <PageHeader
        badge="STATS"
        title="통계"
        description="JOIN, GROUP BY, 집계 쿼리로 만든 운영 지표입니다."
      />
      <OccupancyTable rows={occupancy} />
      <TopSpendersTable rows={spenders} />
      <DailyBookings rows={daily} />
    </section>
  );
}

type OccupancyRow = {
  performance_id: number;
  title: string;
  total_seats: number;
  booked_seats: number;
  occupancy_pct: number | null;
};

function OccupancyTable({ rows }: { rows: OccupancyRow[] }) {
  return (
    <StatsBlock
      title="공연별 좌석 점유율"
      description="LEFT JOIN seats / booking_seats + GROUP BY"
    >
      <table className="w-full text-sm" data-testid="occupancy-table">
        <thead>
          <tr className="text-left text-xs font-semibold text-muted">
            <th className="pb-3">공연</th>
            <th className="pb-3">좌석</th>
            <th className="pb-3">예매됨</th>
            <th className="pb-3">점유율</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.performance_id}
              className="border-t border-line"
              data-testid={`occupancy-${r.performance_id}`}
            >
              <td className="py-3 font-medium text-foreground">{r.title}</td>
              <td className="py-3 text-foreground-2">{r.total_seats}</td>
              <td className="py-3 text-foreground-2">{r.booked_seats}</td>
              <td className="py-3 font-bold text-foreground">
                {r.occupancy_pct ?? 0}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </StatsBlock>
  );
}

type SpenderRow = {
  user_id: number;
  name: string;
  total_spent: number;
  booking_count: number;
};

function TopSpendersTable({ rows }: { rows: SpenderRow[] }) {
  return (
    <StatsBlock
      title="결제액 TOP 5"
      description="users ⨯ bookings JOIN + SUM + ORDER BY LIMIT"
    >
      {rows.length === 0 ? (
        <EmptyRow label="아직 예매가 없습니다." />
      ) : (
        <table className="w-full text-sm" data-testid="spenders-table">
          <thead>
            <tr className="text-left text-xs font-semibold text-muted">
              <th className="pb-3">사용자</th>
              <th className="pb-3">예매 건수</th>
              <th className="pb-3">총 결제액</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.user_id} className="border-t border-line">
                <td className="py-3 font-medium text-foreground">{r.name}</td>
                <td className="py-3 text-foreground-2">{r.booking_count}</td>
                <td className="py-3 font-bold text-foreground">
                  ₩{r.total_spent.toLocaleString("ko-KR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </StatsBlock>
  );
}

type DailyRow = { day: string; booking_count: number };

function DailyBookings({ rows }: { rows: DailyRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.booking_count));
  return (
    <StatsBlock
      title="일별 예매 건수 (최근 14일)"
      description="date_trunc('day', created_at) + GROUP BY"
    >
      {rows.length === 0 ? (
        <EmptyRow label="데이터가 없습니다." />
      ) : (
        <ul className="space-y-2" data-testid="daily-bookings">
          {rows.map((r) => (
            <li key={r.day} className="flex items-center gap-3 text-sm">
              <span className="w-24 font-medium text-foreground-2">{r.day}</span>
              <span className="flex-1">
                <span
                  className="inline-block h-2 rounded-full bg-accent"
                  style={{ width: `${(r.booking_count / max) * 100}%` }}
                  aria-hidden
                />
              </span>
              <span className="w-12 text-right font-bold text-foreground">
                {r.booking_count}건
              </span>
            </li>
          ))}
        </ul>
      )}
    </StatsBlock>
  );
}

function StatsBlock({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      <p className="mt-1 text-xs text-muted">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function EmptyRow({ label }: { label: string }) {
  return <p className="text-sm text-muted">{label}</p>;
}
