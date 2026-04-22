-- 공통코드 마스터 (단위 등)
-- 테이블명: OM_CODE_M
-- main_cd: 코드 그룹 (예: PACK_UNIT), sub_cd: 코드값 (예: EA, CS)
-- code_nm: JSONB 다국어 코드명 {"ko":"개","en":"EA"}
-- code_info: JSONB use_yn, disp_seq 등

CREATE TABLE IF NOT EXISTS OM_CODE_M (
    main_cd    VARCHAR(50)    NOT NULL,
    sub_cd     VARCHAR(50)    NOT NULL,
    code_nm    JSONB,
    code_info  JSONB,
    created_at TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(48),
    updated_by      VARCHAR(48),
    PRIMARY KEY (main_cd, sub_cd)
);

COMMENT ON TABLE OM_CODE_M IS '공통코드 마스터';
COMMENT ON COLUMN OM_CODE_M.main_cd IS '코드 그룹 (예: PACK_UNIT)';
COMMENT ON COLUMN OM_CODE_M.sub_cd IS '코드값 (예: EA, CS)';
COMMENT ON COLUMN OM_CODE_M.code_nm IS '다국어 코드명 JSONB {"ko":"개","en":"EA"}';
COMMENT ON COLUMN OM_CODE_M.code_info IS 'JSONB use_yn, disp_seq 등';
COMMENT ON COLUMN OM_CODE_M.created_at IS '최초 생성 시각';
COMMENT ON COLUMN OM_CODE_M.updated_at IS '최종 수정 시각';
COMMENT ON COLUMN OM_CODE_M.created_by IS '생성자 식별자';
COMMENT ON COLUMN OM_CODE_M.updated_by IS '수정자 식별자';

-- code_info JSONB 구조
-- use_yn   : "Y" | "N"
-- disp_seq : number (정렬용)
-- etc1 : 기타부가정보
-- etc2 : 기타부가정보
-- etc3 : 기타부가정보

-- =============================================================================
-- 공통코드 데이터: 주문관리 (주문처리상태, 주문타입, 결제방법)
-- om_order_m.order_process_status, order_type_cd 드롭다운/필터 연동
-- 판매구분(SALES_TYPE): docs/dml/om_code_m_data_store_currency.sql 에 등록됨
-- =============================================================================

-- 1) 그룹 정의 (CODE 하위)
INSERT INTO OM_CODE_M (main_cd, sub_cd, code_nm, code_info) VALUES
('CODE', 'ORDER_PROCESS_STATUS', '{"ko":"주문처리상태","en":"Order Process Status"}', '{"use_yn":"Y","disp_seq":10}'),
('CODE', 'ORDER_TYPE',            '{"ko":"주문타입","en":"Order Type"}',            '{"use_yn":"Y","disp_seq":11}'),
('CODE', 'PAYMENT_METHOD',        '{"ko":"결제방법","en":"Payment Method"}',        '{"use_yn":"Y","disp_seq":12}')
ON CONFLICT (main_cd, sub_cd) DO UPDATE SET
  code_nm = EXCLUDED.code_nm,
  code_info = EXCLUDED.code_info,
  updated_at = CURRENT_TIMESTAMP;

-- 2) 주문처리상태 상세 코드 (ORDER_PROCESS_STATUS 하위, om_order_m.order_process_status). code_nm: ko, en, ja, vi
INSERT INTO OM_CODE_M (main_cd, sub_cd, code_nm, code_info) VALUES
('ORDER_PROCESS_STATUS', 'ORDER_RECEIVED', '{"ko":"발주(접수)","en":"Order Received","ja":"発注受付","vi":"Đơn đã nhận"}',     '{"use_yn":"Y","disp_seq":1}'),
('ORDER_PROCESS_STATUS', 'PROCESSING',     '{"ko":"처리(주문서처리)","en":"Processing","ja":"合梱処理","vi":"Đóng gói chung"}',    '{"use_yn":"Y","disp_seq":2}'),
('ORDER_PROCESS_STATUS', 'SHIP_READY',     '{"ko":"출고준비","en":"Ship Ready","ja":"出荷準備","vi":"Sẵn sàng giao"}',          '{"use_yn":"Y","disp_seq":3}'),
('ORDER_PROCESS_STATUS', 'DELIVERY_READY', '{"ko":"발송준비","en":"Delivery Ready","ja":"発送準備","vi":"Sẵn sàng phát"}',     '{"use_yn":"Y","disp_seq":4}'),
('ORDER_PROCESS_STATUS', 'SHIPPING',       '{"ko":"배송중","en":"Shipping","ja":"配送中","vi":"Đang giao"}',             '{"use_yn":"Y","disp_seq":5}'),
('ORDER_PROCESS_STATUS', 'DELIVERED',      '{"ko":"배송완료","en":"Delivered","ja":"配送完了","vi":"Đã giao"}',          '{"use_yn":"Y","disp_seq":6}'),
('ORDER_PROCESS_STATUS', 'CANCELLED',      '{"ko":"취소","en":"Cancelled","ja":"キャンセル","vi":"Đã hủy"}',              '{"use_yn":"Y","disp_seq":7}'),
('ORDER_PROCESS_STATUS', 'HOLD',           '{"ko":"출고보류","en":"Hold","ja":"保留","vi":"Giữ"}',                '{"use_yn":"Y","disp_seq":8}'),
('ORDER_PROCESS_STATUS', 'UNMATCHED',      '{"ko":"비매칭","en":"Unmatched","ja":"未マッチ","vi":"Không khớp"}',            '{"use_yn":"Y","disp_seq":9}')
ON CONFLICT (main_cd, sub_cd) DO UPDATE SET
  code_nm = EXCLUDED.code_nm,
  code_info = EXCLUDED.code_info,
  updated_at = CURRENT_TIMESTAMP;

-- 3) 주문타입 상세 코드 (ORDER_TYPE 하위, om_order_m.order_type_cd). code_nm: ko, en, ja, vi
INSERT INTO OM_CODE_M (main_cd, sub_cd, code_nm, code_info) VALUES
('ORDER_TYPE', 'NORMAL',  '{"ko":"일반","en":"Normal","ja":"通常","vi":"Thường"}',   '{"use_yn":"Y","disp_seq":1}'),
('ORDER_TYPE', 'EXCHANGE', '{"ko":"교환","en":"Exchange","ja":"交換","vi":"Đổi"}', '{"use_yn":"Y","disp_seq":2}'),
('ORDER_TYPE', 'RETURN',   '{"ko":"반품","en":"Return","ja":"返品","vi":"Trả hàng"}',   '{"use_yn":"Y","disp_seq":3}'),
('ORDER_TYPE', 'CANCEL',   '{"ko":"취소","en":"Cancel","ja":"キャンセル","vi":"Hủy"}',   '{"use_yn":"Y","disp_seq":4}'),
('ORDER_TYPE', 'ETC',     '{"ko":"기타","en":"Other","ja":"その他","vi":"Khác"}',    '{"use_yn":"Y","disp_seq":5}')
ON CONFLICT (main_cd, sub_cd) DO UPDATE SET
  code_nm = EXCLUDED.code_nm,
  code_info = EXCLUDED.code_info,
  updated_at = CURRENT_TIMESTAMP;

-- 4) 결제방법 상세 코드 (PAYMENT_METHOD 하위, order_info.paymentMethodCd). code_nm: ko, en, ja, vi
INSERT INTO OM_CODE_M (main_cd, sub_cd, code_nm, code_info) VALUES
('PAYMENT_METHOD', 'CARD',          '{"ko":"카드","en":"Card","ja":"カード","vi":"Thẻ"}',           '{"use_yn":"Y","disp_seq":1}'),
('PAYMENT_METHOD', 'CASH',          '{"ko":"현금","en":"Cash","ja":"現金","vi":"Tiền mặt"}',           '{"use_yn":"Y","disp_seq":2}'),
('PAYMENT_METHOD', 'BANK_TRANSFER', '{"ko":"계좌이체","en":"Bank Transfer","ja":"振込","vi":"Chuyển khoản"}', '{"use_yn":"Y","disp_seq":3}'),
('PAYMENT_METHOD', 'MOBILE',       '{"ko":"휴대폰결제","en":"Mobile Payment","ja":"携帯決済","vi":"Thanh toán di động"}', '{"use_yn":"Y","disp_seq":4}'),
('PAYMENT_METHOD', 'ETC',          '{"ko":"기타","en":"Other","ja":"その他","vi":"Khác"}',           '{"use_yn":"Y","disp_seq":5}')
ON CONFLICT (main_cd, sub_cd) DO UPDATE SET
  code_nm = EXCLUDED.code_nm,
  code_info = EXCLUDED.code_info,
  updated_at = CURRENT_TIMESTAMP;
