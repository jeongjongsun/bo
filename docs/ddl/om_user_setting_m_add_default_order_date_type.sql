-- 주문 그리드 기간 검색 기본값 컬럼 추가
-- 적용: 이미 om_user_setting_m이 있는 DB에서 1회 실행.

ALTER TABLE om_user_setting_m
  ADD COLUMN IF NOT EXISTS default_order_date_type VARCHAR(20) NULL;

COMMENT ON COLUMN om_user_setting_m.default_order_date_type IS '주문 그리드 기간 검색 기본값 (ORDER_DT: 주문일, REGIST_DT: 등록일)';
