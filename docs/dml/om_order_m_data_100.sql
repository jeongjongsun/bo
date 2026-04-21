-- 주문 샘플 100건 (마스터 100행 + 라인 100행, 주문당 1라인)
-- 실행 순서: om_order_m.sql, om_order_item_m.sql 적용 후, om_corporation_m·om_mall_store_m 존재 시
-- regist_dt: 2025-01-01 ~ 2025-03-31 (파티션 2025_01, 2025_02, 2025_03)
-- 중복 실행 시 PK/UK 위반. 재삽입 시 기존 1~100 구간 삭제 후 실행

-- 1) om_order_m (주문 마스터 100건)
INSERT INTO om_order_m (
    order_id, corporation_cd, mall_cd, store_cd, order_dt, regist_dt, order_no,
    combined_ship_no, sales_type_cd, order_process_status, order_process_status_dt,
    order_process_status_by, order_type_cd,
    receiver_nm, receiver_tel, receiver_addr, receiver_addr2, receiver_zip,
    orderer_nm, orderer_tel, memo, created_by
)
SELECT
    g.id AS order_id,
    'CORP01' AS corporation_cd,
    (ARRAY['MALL01','MALL02','MALL03'])[1 + (g.id - 1) % 3] AS mall_cd,
    (ARRAY['STORE_11ST_01','STORE_GMKT_01','STORE_AMZ_01'])[1 + (g.id - 1) % 3] AS store_cd,
    ('2025-01-01'::date + ((g.id - 1) * 3 % 90) * interval '1 day')::date AS order_dt,
    ('2025-01-01'::date + ((g.id - 1) * 7 % 90) * interval '1 day')::date AS regist_dt,
    'ORD-2025-' || lpad(g.id::text, 4, '0') AS order_no,
    CASE WHEN g.id % 5 = 0 THEN 'SHP-' || lpad((g.id / 5)::text, 4, '0') ELSE NULL END AS combined_ship_no,
    (ARRAY['B2C_DOMESTIC','B2C_DOMESTIC','B2C_OVERSEAS','B2B_DOMESTIC','ETC'])[1 + (g.id - 1) % 5] AS sales_type_cd,
    (ARRAY['ORDER_RECEIVED','PROCESSING','SHIP_READY','DELIVERY_READY','SHIPPING','DELIVERED','CANCELLED','HOLD','UNMATCHED'])[1 + (g.id - 1) % 9] AS order_process_status,
    CURRENT_TIMESTAMP - (g.id || ' hours')::interval AS order_process_status_dt,
    'system' AS order_process_status_by,
    (ARRAY['NORMAL','NORMAL','EXCHANGE','RETURN','ETC'])[1 + (g.id - 1) % 5] AS order_type_cd,
    '수취인' || g.id AS receiver_nm,
    '010-' || lpad((1111 + g.id)::text, 4, '0') || '-' || lpad((g.id * 37 % 10000)::text, 4, '0') AS receiver_tel,
    '서울시 강남구 테헤란로 ' || (100 + g.id) || ' (샘플주소)' AS receiver_addr,
    (g.id % 20) || '동 ' || (1 + g.id % 30) || '호' AS receiver_addr2,
    '06' || lpad((g.id % 100)::text, 3, '0') || '0' AS receiver_zip,
    '주문자' || g.id AS orderer_nm,
    '010-' || lpad((9999 - g.id % 100)::text, 4, '0') || '-' || lpad((g.id * 17 % 10000)::text, 4, '0') AS orderer_tel,
    CASE WHEN g.id % 4 = 0 THEN '배송 메모 ' || g.id ELSE NULL END AS memo,
    'system' AS created_by
FROM generate_series(1, 100) AS g(id);

-- 2) om_order_item_m (주문당 1라인, 100행)
INSERT INTO om_order_item_m (
    order_id, regist_dt, line_no, item_order_no, product_cd, product_nm,
    line_qty, line_amount, line_discount_amount, created_by
)
SELECT
    g.id AS order_id,
    ('2025-01-01'::date + ((g.id - 1) * 7 % 90) * interval '1 day')::date AS regist_dt,
    1 AS line_no,
    'ITEM-2025-' || lpad(g.id::text, 4, '0') AS item_order_no,
    'P' || lpad((1 + (g.id - 1) % 15)::text, 4, '0') AS product_cd,
    (ARRAY['생수 500ml','주스 오렌지 1L','우유 1L','라면 5입','과자 80g','캔커피 250ml','물티슈 80매','휴지 30롤','세제 2.5L','샴푸 500ml','린스 500ml','바디워시 1L','치약 150g','휴대폰케이스','USB케이블 1m'])[1 + (g.id - 1) % 15] AS product_nm,
    1 + (g.id - 1) % 5 AS line_qty,
    (3000 + (g.id * 127) % 20000)::numeric(15,2) AS line_amount,
    (0 + (g.id % 3) * 500)::numeric(15,2) AS line_discount_amount,
    'system' AS created_by
FROM generate_series(1, 100) AS g(id);

SELECT setval('seq_order_id', 100);
