-- 동일 주문번호 1건에 상품별 주문번호만 다른 여러 라인 (1주문 다상품) 등록
-- 실행 조건: om_order_m, om_order_item_m 적용 후, 동일 (regist_dt, corporation_cd, mall_cd, store_cd, order_no) 없을 것
-- 파티션: regist_dt에 해당하는 월별 파티션 존재 필요 (예: 2026-03)
-- 주의: 마스터·라인 INSERT는 반드시 같은 세션(한 번에) 실행 (currval로 동일 order_id 사용)

-- 1) 주문 마스터 1건
INSERT INTO om_order_m (
    order_id, corporation_cd, mall_cd, store_cd, order_dt, regist_dt, order_no,
    combined_ship_no, sales_type_cd, order_process_status, order_type_cd,
    receiver_nm, receiver_tel, receiver_addr, receiver_addr2, receiver_zip,
    orderer_nm, orderer_tel, memo, created_by
) VALUES (
    nextval('seq_order_id'),   -- order_id (라인과 공유)
    'CORP01',
    'MALL01',
    'STORE_11ST_01',
    '2026-03-01',
    '2026-03-01',
    'ORD-2025-MULTI-001',      -- 동일 주문번호 (이 주문에 라인 N건)
    NULL,
    'B2C_DOMESTIC',
    'ORDER_RECEIVED',
    'NORMAL',
    '홍길동',
    '010-1234-5678',
    '서울시 강남구 테헤란로 123',
    '101동 1001호',
    '06123',
    '김주문',
    '010-9876-5432',
    '문 앞에 놔주세요',
    'system'
);

-- 2) 위 주문의 라인 3건 (상품별 주문번호·상품만 다름, order_id·regist_dt는 마스터와 동일)
-- order_id = currval('seq_order_id') 사용 (방금 삽입한 마스터의 order_id)
INSERT INTO om_order_item_m (
    order_id, regist_dt, line_no, item_order_no, product_cd, product_nm,
    line_qty, line_amount, line_discount_amount, created_by
) VALUES
    (currval('seq_order_id'), '2026-03-01'::date, 1, 'ORD-2025-MULTI-001-01', 'P0001', '생수 500ml',           2,  2000.00,  0.00, 'system'),
    (currval('seq_order_id'), '2026-03-01'::date, 2, 'ORD-2025-MULTI-001-02', 'P0002', '주스 오렌지 1L',     1,  3500.00,  500.00, 'system'),
    (currval('seq_order_id'), '2026-03-01'::date, 3, 'ORD-2025-MULTI-001-03', 'P0003', '우유 1L',             3,  7500.00,  0.00, 'system');
