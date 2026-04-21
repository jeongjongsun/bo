-- 주문 데이터 1만 건 (국내 B2C, 발주 접수, 2026-02-01 ~ 2026-03-01 랜덤, 합포장 대상 혼합)
-- 실행 조건: om_order_m, om_order_item_m 적용 후, seq_order_id 존재. om_order_item_m_add_is_deleted 적용 시 is_deleted 기본값 사용.
-- 파티션: 2026년 2월·3월 파티션 필요 (아래 2026_02 생성 후 실행)
-- 합포장 대상: 동일 상점·동일 수령인(그룹 500개)으로 약 20건씩 묶임 → 주문서 처리 시 동일 합포장번호 부여 대상

-- 2026년 2월 파티션 없으면 생성
CREATE TABLE IF NOT EXISTS om_order_m_2026_02 PARTITION OF om_order_m FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- 1) 임시로 주문 키·수령인 그룹 생성 (1만 건, 그룹 500개 = 합포장 대상 약 20건씩)
CREATE TEMP TABLE tmp_ord_10k AS
SELECT
    g.rn,
    nextval('seq_order_id') AS order_id,
    'CORP01' AS corporation_cd,
    (ARRAY['MALL01','MALL02'])[1 + (g.rn % 2)] AS mall_cd,
    'STORE_' || lpad((1 + ((1 + (g.rn - 1) % 500) - 1) % 30)::text, 2, '0') AS store_cd,
    ('2026-02-01'::date + (random() * 30)::int)::date AS order_dt,
    ('2026-02-01'::date + (random() * 30)::int)::date AS regist_dt,
    (1 + (g.rn - 1) % 500) AS group_id
FROM generate_series(1, 10000) g(rn);

-- 2) om_order_m 1만 건 (국내 B2C, 발주 접수, 합포장번호 NULL / 동일 그룹 = 동일 상점·수령인)
INSERT INTO om_order_m (
    order_id, corporation_cd, mall_cd, store_cd, order_dt, regist_dt, order_no,
    combined_ship_no, sales_type_cd, order_process_status, order_process_status_dt,
    order_process_status_by, order_type_cd,
    receiver_nm, receiver_tel, receiver_addr, receiver_addr2, receiver_zip,
    orderer_nm, orderer_tel, memo, created_by
)
SELECT
    t.order_id,
    t.corporation_cd,
    t.mall_cd,
    t.store_cd,
    t.order_dt,
    t.regist_dt,
    'ORD-2026-' || t.rn AS order_no,
    NULL AS combined_ship_no,
    'B2C_DOMESTIC' AS sales_type_cd,
    'ORDER_RECEIVED' AS order_process_status,
    NULL AS order_process_status_dt,
    NULL AS order_process_status_by,
    'NORMAL' AS order_type_cd,
    '수취인그룹' || t.group_id AS receiver_nm,
    '010-' || lpad((1000 + t.group_id % 9000)::text, 4, '0') || '-' || lpad((t.group_id * 37 % 10000)::text, 4, '0') AS receiver_tel,
    '서울시 강남구 합포장로 ' || t.group_id AS receiver_addr,
    (t.group_id % 20)::text || '동 ' || (1 + t.group_id % 30)::text || '호' AS receiver_addr2,
    lpad((t.group_id % 100000)::text, 5, '0') AS receiver_zip,
    '주문자' || t.rn AS orderer_nm,
    '010-' || lpad((2000 + t.rn % 8000)::text, 4, '0') || '-' || lpad((t.rn * 17 % 10000)::text, 4, '0') AS orderer_tel,
    CASE WHEN t.rn % 7 = 0 THEN '배송 메모 ' || t.rn ELSE NULL END AS memo,
    'system' AS created_by
FROM tmp_ord_10k t;

-- 3) om_order_item_m 1만 행 (주문당 1라인)
INSERT INTO om_order_item_m (
    order_id, regist_dt, line_no, item_order_no, product_cd, product_nm,
    line_qty, line_amount, line_discount_amount, created_by
)
SELECT
    t.order_id,
    t.regist_dt,
    1 AS line_no,
    'ITEM-2026-' || t.rn AS item_order_no,
    'P' || lpad((1 + (t.rn - 1) % 15)::text, 4, '0') AS product_cd,
    (ARRAY['생수 500ml','주스 오렌지 1L','우유 1L','라면 5입','과자 80g','캔커피 250ml','물티슈 80매','휴지 30롤','세제 2.5L','샴푸 500ml','린스 500ml','바디워시 1L','치약 150g','휴대폰케이스','USB케이블 1m'])[1 + (t.rn - 1) % 15] AS product_nm,
    1 + (t.rn - 1) % 5 AS line_qty,
    (3000 + (t.rn * 127) % 20000)::numeric(15,2) AS line_amount,
    (t.rn % 3 * 500)::numeric(15,2) AS line_discount_amount,
    'system' AS created_by
FROM tmp_ord_10k t;

-- is_deleted 컬럼이 있으면 기본값만 사용(미지정 시 false)
-- 필요 시: ALTER TABLE om_order_item_m ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;

DROP TABLE tmp_ord_10k;

-- 시퀀스는 nextval로 1만 번 호출된 상태이므로 추가 조정 불필요.
--
-- 요약:
-- - 주문일/등록일: 2026-02-01 ~ 2026-03-01 랜덤 (매 실행 시 다른 값).
-- - sales_type_cd = B2C_DOMESTIC, order_process_status = ORDER_RECEIVED, combined_ship_no = NULL.
-- - 합포장 대상: group_id 1~500 → 동일 그룹 = 동일 store_cd·수령인(명/주소/연락처) → 주문서 처리 시 동일 합포장번호 부여됨.
