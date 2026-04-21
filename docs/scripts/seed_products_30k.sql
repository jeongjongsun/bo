-- 성능 테스트용: 한빛음료(주) 법인에 상품 3만 건 삽입
-- 법인코드: CORP01 (한빛음료(주)). 실제 DB의 법인코드에 맞게 수정 후 실행.
-- 실행: psql -U <user> -d <database> -f docs/scripts/seed_products_30k.sql

INSERT INTO om_product_m (
  product_id,
  corporation_cd,
  product_cd,
  product_nm,
  product_type,
  sale_price,
  stock_qty,
  is_gift,
  is_sale,
  is_display,
  product_info,
  created_at,
  updated_at,
  is_deleted
)
SELECT
  'perf-' || n::text,
  'CORP01',
  'P' || lpad(n::text, 6, '0'),
  '상품_' || n::text,
  'SINGLE',
  0,
  0,
  false,
  true,
  true,
  '{}'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  false
FROM generate_series(1, 30000) AS n
ON CONFLICT (corporation_cd, product_cd) DO NOTHING;
