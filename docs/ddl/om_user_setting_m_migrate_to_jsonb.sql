-- om_user_setting_m 컬럼 구조를 JSONB(setting_values) 단일 컬럼으로 전환
-- 적용: 기존 order_simple_view_yn, default_corporation_cd, default_order_date_type 컬럼이 있는 DB에서 1회 실행.

-- 1) JSONB 컬럼 추가
ALTER TABLE om_user_setting_m ADD COLUMN IF NOT EXISTS setting_values JSONB NOT NULL DEFAULT '{}';

-- 2) 기존 컬럼 값으로 JSONB 채우기 (order_simple_view_yn이 있을 때만)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'om_user_setting_m' AND column_name = 'order_simple_view_yn'
  ) THEN
    -- default_order_date_type 없을 수 있으므로 별도 처리
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'om_user_setting_m' AND column_name = 'default_order_date_type'
    ) THEN
      UPDATE om_user_setting_m
         SET setting_values = jsonb_build_object(
               'orderSimpleViewYn', COALESCE(order_simple_view_yn, false),
               'defaultCorporationCd', default_corporation_cd,
               'defaultOrderDateType', default_order_date_type
             )
       WHERE setting_values = '{}' OR setting_values IS NULL;
    ELSE
      UPDATE om_user_setting_m
         SET setting_values = jsonb_build_object(
               'orderSimpleViewYn', COALESCE(order_simple_view_yn, false),
               'defaultCorporationCd', default_corporation_cd,
               'defaultOrderDateType', NULL
             )
       WHERE setting_values = '{}' OR setting_values IS NULL;
    END IF;
  END IF;
END $$;

-- 3) FK·인덱스·구컬럼 제거
ALTER TABLE om_user_setting_m DROP CONSTRAINT IF EXISTS fk_user_setting_corporation;
DROP INDEX IF EXISTS idx_user_setting_default_corporation;
ALTER TABLE om_user_setting_m DROP COLUMN IF EXISTS order_simple_view_yn;
ALTER TABLE om_user_setting_m DROP COLUMN IF EXISTS default_corporation_cd;
ALTER TABLE om_user_setting_m DROP COLUMN IF EXISTS default_order_date_type;

-- 4) 기존 행 중 setting_values가 비어 있으면 빈 객체로
UPDATE om_user_setting_m SET setting_values = '{}' WHERE setting_values IS NULL;
