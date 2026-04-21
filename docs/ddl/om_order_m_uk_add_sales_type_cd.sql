-- om_order_m 유니크 제약에 sales_type_cd 추가
-- B2C/B2B에 따라 동일 주문번호 허용. 기존 UK (regist_dt, corporation_cd, mall_cd, store_cd, order_no) → (regist_dt, corporation_cd, sales_type_cd, mall_cd, store_cd, order_no)
-- 적용: 이미 om_order_m이 있는 DB에서 1회 실행. 신규 구축 시에는 om_order_m.sql의 CONSTRAINT를 이 순서로 정의하면 됨.

ALTER TABLE om_order_m DROP CONSTRAINT IF EXISTS uk_order_m_regist_corp_mall_store_no;
ALTER TABLE om_order_m ADD CONSTRAINT uk_order_m_regist_corp_mall_store_no
  UNIQUE (regist_dt, corporation_cd, sales_type_cd, mall_cd, store_cd, order_no);
