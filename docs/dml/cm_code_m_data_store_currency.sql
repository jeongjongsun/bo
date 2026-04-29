-- 공통코드 데이터: 하이어라키 구조 (상점구분, 통화코드, 판매구분)
-- 1단계: CODE 그룹 정의 (main_cd='CODE', sub_cd=그룹코드)
-- 2단계: 그룹별 상세 코드 (main_cd=그룹코드, sub_cd=코드값)
-- 실행 순서: docs/ddl/cm_code_m.sql 적용 후 실행

-- 1) 그룹 정의 (CODE 하위)
INSERT INTO CM_CODE_M (main_cd, sub_cd, code_nm, code_info) VALUES
('CODE', 'STORE_TYPE',  '{"ko":"상점구분","en":"Store Type"}',  '{"use_yn":"Y","disp_seq":1}'),
('CODE', 'CURRENCY',    '{"ko":"통화코드","en":"Currency"}',    '{"use_yn":"Y","disp_seq":2}'),
('CODE', 'SALES_TYPE',  '{"ko":"판매구분","en":"Sales Type"}',  '{"use_yn":"Y","disp_seq":3}')
ON CONFLICT (main_cd, sub_cd) DO UPDATE SET
  code_nm = EXCLUDED.code_nm,
  code_info = EXCLUDED.code_info,
  updated_at = CURRENT_TIMESTAMP;

-- 2) 상점구분 상세 코드 (STORE_TYPE 하위)
INSERT INTO CM_CODE_M (main_cd, sub_cd, code_nm, code_info) VALUES
('STORE_TYPE', 'OWN',    '{"ko":"자사몰","en":"Own Mall"}',      '{"use_yn":"Y","disp_seq":1}'),
('STORE_TYPE', 'OPEN',   '{"ko":"오픈마켓","en":"Open Market"}', '{"use_yn":"Y","disp_seq":2}'),
('STORE_TYPE', 'OFFLINE','{"ko":"오프라인","en":"Offline"}',     '{"use_yn":"Y","disp_seq":3}')
ON CONFLICT (main_cd, sub_cd) DO UPDATE SET
  code_nm = EXCLUDED.code_nm,
  code_info = EXCLUDED.code_info,
  updated_at = CURRENT_TIMESTAMP;

-- 3) 통화코드 상세 코드 (CURRENCY 하위)
INSERT INTO CM_CODE_M (main_cd, sub_cd, code_nm, code_info) VALUES
('CURRENCY', 'KRW', '{"ko":"원","en":"KRW"}',             '{"use_yn":"Y","disp_seq":1}'),
('CURRENCY', 'USD', '{"ko":"미국 달러","en":"US Dollar"}', '{"use_yn":"Y","disp_seq":2}'),
('CURRENCY', 'EUR', '{"ko":"유로","en":"Euro"}',           '{"use_yn":"Y","disp_seq":3}'),
('CURRENCY', 'JPY', '{"ko":"일본 엔","en":"Japanese Yen"}', '{"use_yn":"Y","disp_seq":4}'),
('CURRENCY', 'CNY', '{"ko":"중국 위안","en":"Chinese Yuan"}', '{"use_yn":"Y","disp_seq":5}'),
('CURRENCY', 'GBP', '{"ko":"영국 파운드","en":"British Pound"}', '{"use_yn":"Y","disp_seq":6}')
ON CONFLICT (main_cd, sub_cd) DO UPDATE SET
  code_nm = EXCLUDED.code_nm,
  code_info = EXCLUDED.code_info,
  updated_at = CURRENT_TIMESTAMP;

-- 4) 판매구분 상세 코드 (SALES_TYPE 하위, 레거시·호환용. 쇼핑몰 채널 구분은 ORDER_CHANNEL_TYPE 권장: docs/dml/cm_code_m_insert_order_channel_type.sql)
INSERT INTO CM_CODE_M (main_cd, sub_cd, code_nm, code_info) VALUES
('SALES_TYPE', 'B2C_DOMESTIC', '{"ko":"B2C 국내","en":"B2C Domestic"}',   '{"use_yn":"Y","disp_seq":1}'),
('SALES_TYPE', 'B2C_OVERSEAS',  '{"ko":"B2C 해외","en":"B2C Overseas"}',   '{"use_yn":"Y","disp_seq":2}'),
('SALES_TYPE', 'B2B_DOMESTIC',  '{"ko":"B2B 국내","en":"B2B Domestic"}',   '{"use_yn":"Y","disp_seq":3}'),
('SALES_TYPE', 'B2B_OVERSEAS',  '{"ko":"B2B 해외","en":"B2B Overseas"}',   '{"use_yn":"Y","disp_seq":4}'),
('SALES_TYPE', 'ETC',           '{"ko":"기타주문","en":"Other"}',          '{"use_yn":"Y","disp_seq":5}')
ON CONFLICT (main_cd, sub_cd) DO UPDATE SET
  code_nm = EXCLUDED.code_nm,
  code_info = EXCLUDED.code_info,
  updated_at = CURRENT_TIMESTAMP;
