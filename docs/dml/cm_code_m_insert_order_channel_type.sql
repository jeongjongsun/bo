-- CM_CODE_M: 주문채널타입(ORDER_CHANNEL_TYPE) 그룹 + B2C/B2B/ETC 상세 코드
-- 상위: CODE.ORDER_CHANNEL_TYPE → 하위: ORDER_CHANNEL_TYPE.B2C_DOMESTIC 등
--       (기존 cm_code_m_data_store_currency.sql 의 SALES_TYPE·ORDER_TYPE 과 별도 그룹)
--
-- 실행 순서: CM_CODE_M DDL 적용 후
-- code_nm: ko, en, ja, vi / code_info: use_yn, disp_seq

-- 1) 그룹 정의 (CODE 하위)
INSERT INTO CM_CODE_M (main_cd, sub_cd, code_nm, code_info) VALUES
('CODE', 'ORDER_CHANNEL_TYPE', '{"ko":"주문채널타입","en":"Order Channel Type","ja":"注文チャネルタイプ","vi":"Loại kênh đơn hàng"}', '{"use_yn":"Y","disp_seq":11}')
ON CONFLICT (main_cd, sub_cd) DO UPDATE SET
    code_nm = EXCLUDED.code_nm,
    code_info = EXCLUDED.code_info,
    updated_at = CURRENT_TIMESTAMP;

-- 2) 주문채널타입 상세 (판매·채널 구분)
INSERT INTO CM_CODE_M (main_cd, sub_cd, code_nm, code_info) VALUES
('ORDER_CHANNEL_TYPE', 'B2C_DOMESTIC', '{"ko":"B2C 국내","en":"B2C Domestic","ja":"B2C国内","vi":"B2C trong nước"}', '{"use_yn":"Y","disp_seq":1}'),
('ORDER_CHANNEL_TYPE', 'B2C_OVERSEAS', '{"ko":"B2C 해외","en":"B2C Overseas","ja":"B2C海外","vi":"B2C nước ngoài"}', '{"use_yn":"Y","disp_seq":2}'),
('ORDER_CHANNEL_TYPE', 'B2B_DOMESTIC', '{"ko":"B2B 국내","en":"B2B Domestic","ja":"B2B国内","vi":"B2B trong nước"}', '{"use_yn":"Y","disp_seq":3}'),
('ORDER_CHANNEL_TYPE', 'B2B_OVERSEAS', '{"ko":"B2B 해외","en":"B2B Overseas","ja":"B2B海外","vi":"B2B nước ngoài"}', '{"use_yn":"Y","disp_seq":4}'),
('ORDER_CHANNEL_TYPE', 'ETC', '{"ko":"기타주문","en":"Other","ja":"その他","vi":"Khác"}', '{"use_yn":"Y","disp_seq":5}')
ON CONFLICT (main_cd, sub_cd) DO UPDATE SET
    code_nm = EXCLUDED.code_nm,
    code_info = EXCLUDED.code_info,
    updated_at = CURRENT_TIMESTAMP;
