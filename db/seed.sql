-- Florence Hall — seed
-- 공연 3개 + 각 공연마다 좌석 30개(A/B 섹션 × 3행 × 5번)
-- 별도 함수 없이 단순 INSERT + generate_series 조합.

BEGIN;

INSERT INTO performances (title, artist, performed_at, price, description) VALUES
  ('봄밤의 콘서트', '서울 필하모닉',   NOW() + INTERVAL '14 days', 50000, '봄 시즌 개막 공연'),
  ('재즈 인 더 시티', '김재즈 트리오', NOW() + INTERVAL '21 days', 35000, '도심의 작은 재즈바'),
  ('Indie Night',     'The Florences',  NOW() + INTERVAL '7 days',  25000, '인디 밴드 합동공연')
ON CONFLICT DO NOTHING;

-- 각 공연마다 좌석 30개 생성
INSERT INTO seats (performance_id, section, row_label, seat_number)
SELECT p.id, sec.section, row_label, seat_number
FROM performances p
CROSS JOIN (VALUES ('A'), ('B')) AS sec(section)
CROSS JOIN (VALUES ('1'), ('2'), ('3')) AS r(row_label)
CROSS JOIN generate_series(1, 5) AS seat_number
ON CONFLICT DO NOTHING;

COMMIT;
