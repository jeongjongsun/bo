-- 쇼핑몰·상점 샘플 데이터
-- 실행 순서: docs/ddl/om_mall_m.sql, om_mall_store_m.sql 적용 후 실행
-- om_mall_store_m은 om_corporation_m(corporation_cd) FK 참조 → 법인 없으면 아래 법인 1건 먼저 삽입
--
-- mall_cd: PK, MALL-일련번호4자리 형식 예시

-- (선택) 법인 데이터가 없을 때만 실행: 샘플 법인 1건
INSERT INTO om_corporation_m (corporation_cd, corporation_nm, corporation_info, is_active)
VALUES ('CORP01', '샘플법인', '{}'::jsonb, true)
ON CONFLICT (corporation_cd) DO NOTHING;

-- 1) om_mall_m 샘플 데이터
INSERT INTO om_mall_m (mall_cd, mall_nm, mall_info, api_connection_info, is_active, created_by) VALUES
(
    'MALL-0001',
    '11번가',
    '{"mall_url":"https://www.11st.co.kr","sales_type_cd":"B2C_DOMESTIC"}'::jsonb,
    '{"base_url":"https://api.11st.co.kr","auth_type":"API_KEY","api_version":"v1"}'::jsonb,
    true,
    'system'
),
(
    'MALL-0002',
    'G마켓',
    '{"mall_url":"https://www.gmarket.co.kr","sales_type_cd":"B2C_DOMESTIC"}'::jsonb,
    '{"base_url":"https://api.gmarket.co.kr","auth_type":"OAUTH2","api_version":"v1"}'::jsonb,
    true,
    'system'
),
(
    'MALL-0003',
    'Amazon US',
    '{"mall_url":"https://www.amazon.com","sales_type_cd":"B2C_OVERSEAS"}'::jsonb,
    '{"base_url":"https://api.amazon.com","auth_type":"API_KEY","api_version":"v1"}'::jsonb,
    true,
    'system'
)
ON CONFLICT (mall_cd) DO NOTHING;

-- 2) om_mall_store_m 샘플 데이터 (쇼핑몰별·법인별 상점)
-- CORP01 법인이 om_corporation_m에 존재해야 함
INSERT INTO om_mall_store_m (mall_cd, corporation_cd, store_cd, store_nm, store_info, is_active, created_by) VALUES
('MALL-0001', 'CORP01', 'STORE_11ST_01', '11번가 공식스토어', '{"currency_cd":"KRW","gmt":"+09:00","wms_yn":"Y","store_type_cd":"OPEN"}'::jsonb, true, 'system'),
('MALL-0002', 'CORP01', 'STORE_GMKT_01', 'G마켓 메인스토어', '{"currency_cd":"KRW","gmt":"+09:00","wms_yn":"Y","store_type_cd":"OPEN"}'::jsonb, true, 'system'),
('MALL-0003', 'CORP01', 'STORE_AMZ_01', 'Amazon US 스토어', '{"currency_cd":"USD","gmt":"-05:00","wms_yn":"N","store_type_cd":"OPEN"}'::jsonb, true, 'system')
ON CONFLICT (mall_cd, corporation_cd, store_cd) DO NOTHING;
