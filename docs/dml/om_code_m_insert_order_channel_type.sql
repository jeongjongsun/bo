-- OM_CODE_M: 주문채널타입(ORDER_CHANNEL_TYPE) 그룹 + B2C/B2B/ETC
--
-- om_order_m.order_type_cd 가 쓰는 ORDER_TYPE(일반/교환/반품/취소/기타)과 그룹을 분리합니다.
-- ORDER_CHANNEL_TYPE 하위에는 ETC 가 주문채널 "기타주문"으로 등록되며, ORDER_TYPE 의 ETC 와 PK 가 겹치지 않습니다.
--
-- 실행: docs/ddl/om_code_m.sql 적용 후

-- 1) 그룹 정의 (CODE 하위)
INSERT INTO om_code_m (main_cd, sub_cd, code_nm, code_info) VALUES
('CODE', 'ORDER_CHANNEL_TYPE', '{"ko":"주문채널타입","en":"Order Channel Type","ja":"注文チャネルタイプ","vi":"Loại kênh đơn hàng"}', '{"use_yn":"Y","disp_seq":13}')
ON CONFLICT (main_cd, sub_cd) DO UPDATE SET
    code_nm = EXCLUDED.code_nm,
    code_info = EXCLUDED.code_info,
    updated_at = CURRENT_TIMESTAMP;

-- 2) 주문채널타입 상세 (판매·채널 구분)
INSERT INTO om_code_m (main_cd, sub_cd, code_nm, code_info) VALUES
('ORDER_CHANNEL_TYPE', 'B2C_DOMESTIC', '{"ko":"B2C 국내","en":"B2C Domestic","ja":"B2C国内","vi":"B2C trong nước"}', '{"use_yn":"Y","disp_seq":1}'),
('ORDER_CHANNEL_TYPE', 'B2C_OVERSEAS', '{"ko":"B2C 해외","en":"B2C Overseas","ja":"B2C海外","vi":"B2C nước ngoài"}', '{"use_yn":"Y","disp_seq":2}'),
('ORDER_CHANNEL_TYPE', 'B2B_DOMESTIC', '{"ko":"B2B 국내","en":"B2B Domestic","ja":"B2B国内","vi":"B2B trong nước"}', '{"use_yn":"Y","disp_seq":3}'),
('ORDER_CHANNEL_TYPE', 'B2B_OVERSEAS', '{"ko":"B2B 해외","en":"B2B Overseas","ja":"B2B海外","vi":"B2B nước ngoài"}', '{"use_yn":"Y","disp_seq":4}'),
('ORDER_CHANNEL_TYPE', 'ETC', '{"ko":"기타주문","en":"Other","ja":"その他","vi":"Khác"}', '{"use_yn":"Y","disp_seq":5}')
ON CONFLICT (main_cd, sub_cd) DO UPDATE SET
    code_nm = EXCLUDED.code_nm,
    code_info = EXCLUDED.code_info,
    updated_at = CURRENT_TIMESTAMP;
