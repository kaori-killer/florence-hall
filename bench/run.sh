#!/usr/bin/env bash
# bench/run.sh — pgbench 시나리오 3종 + 인덱스 비교 실행
#
# 사용: bash bench/run.sh

set -euo pipefail

PG=/opt/homebrew/opt/postgresql@16/bin
HOST=localhost
PORT=5432
USER=florence
DB=florence_bench
WORKLOAD=$(dirname "$0")/book_workload.sql
INIT=$(dirname "$0")/init.sql
DURATION=${DURATION:-15}

export PGPASSWORD=florence

reset_db() {
  echo "  → DB 초기화..."
  "$PG/psql" -U "$USER" -h "$HOST" -d "$DB" -f "$INIT" >/dev/null
}

run_pgbench() {
  local label=$1
  local clients=$2
  local threads=$3
  echo ""
  echo "==== $label  (clients=$clients, threads=$threads, T=${DURATION}s) ===="
  reset_db
  "$PG/pgbench" \
    -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" \
    -f "$WORKLOAD" \
    -c "$clients" -j "$threads" -T "$DURATION" \
    --no-vacuum --progress=5 2>&1 | tail -20
}

echo "###################################################"
echo "# Florence Hall — pgbench scenarios"
echo "###################################################"

run_pgbench "Scenario 1: Baseline (단일 클라이언트)" 1 1
run_pgbench "Scenario 2: 동시성 (10 클라이언트)" 10 4
run_pgbench "Scenario 3: 고부하 (50 클라이언트)" 50 8

echo ""
echo "==== Scenario 4: 인덱스 영향 비교 ===="
echo ""
echo "[A] 인덱스 ON 상태로 측정"
reset_db
"$PG/pgbench" \
  -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" \
  -f "$WORKLOAD" \
  -c 10 -j 4 -T "$DURATION" \
  --no-vacuum 2>&1 | tail -8

echo ""
echo "[B] idx_bookings_performance 인덱스 DROP 후 측정"
"$PG/psql" -U "$USER" -h "$HOST" -d "$DB" \
  -c "DROP INDEX IF EXISTS idx_bookings_performance;" >/dev/null
reset_db
"$PG/pgbench" \
  -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" \
  -f "$WORKLOAD" \
  -c 10 -j 4 -T "$DURATION" \
  --no-vacuum 2>&1 | tail -8

echo ""
echo "[C] 인덱스 복구"
"$PG/psql" -U "$USER" -h "$HOST" -d "$DB" \
  -c "CREATE INDEX IF NOT EXISTS idx_bookings_performance ON bookings(performance_id);" >/dev/null

echo ""
echo "###################################################"
echo "# 완료. docs/benchmark.md 에 결과 정리하세요."
echo "###################################################"
