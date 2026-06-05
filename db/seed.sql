-- Florence Hall — seed (3-table schema)
-- title 기준 NOT EXISTS 체크로 재실행 안전.

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

COMMIT;
