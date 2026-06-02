-- Florence Hall — seed
-- 공연 3개 + 각 공연마다 좌석 30개(A/B 섹션 × 3행 × 5번)
-- title 기준으로 NOT EXISTS 체크하므로 여러 번 실행해도 안전.

BEGIN;

INSERT INTO performances (title, artist, performed_at, price, description, image_url)
SELECT *
FROM (VALUES
  (
    '봄밤의 콘서트',
    '서울 필하모닉',
    (NOW() + INTERVAL '14 days')::timestamptz,
    50000,
    '봄 시즌 개막 공연',
    'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80'
  ),
  (
    '재즈 인 더 시티',
    '김재즈 트리오',
    (NOW() + INTERVAL '21 days')::timestamptz,
    35000,
    '도심의 작은 재즈바',
    'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=80'
  ),
  (
    'Indie Night',
    'The Florences',
    (NOW() + INTERVAL '7 days')::timestamptz,
    25000,
    '인디 밴드 합동공연',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80'
  )
) AS new_performances(title, artist, performed_at, price, description, image_url)
WHERE NOT EXISTS (
  SELECT 1 FROM performances p WHERE p.title = new_performances.title
);

-- 이미지가 비어 있던 기존 row 만 채워준다
UPDATE performances SET image_url = 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80' WHERE title = '봄밤의 콘서트'   AND image_url IS NULL;
UPDATE performances SET image_url = 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=80' WHERE title = '재즈 인 더 시티' AND image_url IS NULL;
UPDATE performances SET image_url = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80' WHERE title = 'Indie Night'     AND image_url IS NULL;

-- 각 공연마다 좌석 30개 (UNIQUE 제약으로 재실행 안전)
INSERT INTO seats (performance_id, section, row_label, seat_number)
SELECT p.id, sec.section, r.row_label, n
FROM performances p
CROSS JOIN (VALUES ('A'), ('B')) AS sec(section)
CROSS JOIN (VALUES ('1'), ('2'), ('3')) AS r(row_label)
CROSS JOIN generate_series(1, 5) AS n
ON CONFLICT DO NOTHING;

COMMIT;
