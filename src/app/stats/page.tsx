import {
  dailyBookings,
  performanceOccupancy,
  topSpenders,
} from "@/domain/stats";

export default async function StatsPage() {
  const [occupancy, spenders, daily] = await Promise.all([
    performanceOccupancy(),
    topSpenders(5),
    dailyBookings(14),
  ]);

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">통계</h1>
        <p className="text-sm text-neutral-600 mt-1">
          JOIN, GROUP BY, 집계 쿼리 데모.
        </p>
      </header>

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
        <thead className="text-left text-neutral-500">
          <tr>
            <th className="py-2">공연</th>
            <th>좌석</th>
            <th>예매됨</th>
            <th>점유율</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.performance_id}
              className="border-t"
              data-testid={`occupancy-${r.performance_id}`}
            >
              <td className="py-2">{r.title}</td>
              <td>{r.total_seats}</td>
              <td>{r.booked_seats}</td>
              <td>{r.occupancy_pct ?? 0}%</td>
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
        <p className="text-sm text-neutral-500">아직 예매가 없습니다.</p>
      ) : (
        <table className="w-full text-sm" data-testid="spenders-table">
          <thead className="text-left text-neutral-500">
            <tr>
              <th className="py-2">사용자</th>
              <th>예매 건수</th>
              <th>총 결제액</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.user_id} className="border-t">
                <td className="py-2">{r.name}</td>
                <td>{r.booking_count}</td>
                <td>₩{r.total_spent.toLocaleString("ko-KR")}</td>
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
        <p className="text-sm text-neutral-500">데이터가 없습니다.</p>
      ) : (
        <ul className="space-y-1" data-testid="daily-bookings">
          {rows.map((r) => (
            <li key={r.day} className="flex items-center gap-3 text-sm">
              <span className="w-24 text-neutral-500">{r.day}</span>
              <span
                className="inline-block h-3 rounded bg-neutral-900"
                style={{ width: `${(r.booking_count / max) * 200}px` }}
              />
              <span>{r.booking_count}건</span>
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
    <section className="rounded-lg border bg-white p-4">
      <h2 className="font-medium">{title}</h2>
      <p className="text-xs text-neutral-500 mb-3">{description}</p>
      {children}
    </section>
  );
}
