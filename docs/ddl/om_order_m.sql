-- 주문 마스터 (1주문 1행)
-- 테이블명: om_order_m
--
-- 주문 헤더만 저장. 라인(상품)은 om_order_item_m.
-- order_id: seq_order_id 1회/주문. 파티션: regist_dt 월별 RANGE.
-- 상세 설계: docs/ddl/주문_데이터베이스_설계.md

CREATE SEQUENCE seq_order_id START 1;
-- 합포장 번호 채번 (선택 주문서 처리 시 상점·수령인 동일 그룹에 동일 번호 부여)
CREATE SEQUENCE seq_combined_ship_no START 1;
-- 수기 주문번호: M-YYYYMMDD-NNNN. 채번은 (regist_dt, corporation_cd, mall_cd, store_cd) 당 일별 MAX+1 사용 (OmOrderMMapper.getNextManualOrderNo). 아래 시퀀스는 미사용(과거 호환용, DROP 가능).
-- CREATE SEQUENCE seq_manual_order_no START 1;

-- 부모 테이블 (PARTITION BY RANGE (regist_dt))
CREATE TABLE om_order_m (
    order_id                  BIGINT         NOT NULL,
    corporation_cd            VARCHAR(20)    NOT NULL,
    mall_cd                   VARCHAR(20)    NOT NULL,
    store_cd                  VARCHAR(50)    NOT NULL,
    order_dt                  DATE           NOT NULL,
    regist_dt                 DATE           NOT NULL,
    order_no                  VARCHAR(100)   NOT NULL,
    combined_ship_no          VARCHAR(100),
    sales_type_cd             VARCHAR(20)    NOT NULL DEFAULT 'ETC',
    order_process_status      VARCHAR(30)    NOT NULL DEFAULT 'ORDER_RECEIVED',
    order_process_status_dt   TIMESTAMPTZ,
    order_process_status_by   VARCHAR(48),
    order_type_cd             VARCHAR(20)    NOT NULL DEFAULT 'NORMAL',
    order_info                JSONB          DEFAULT '{}',
    created_at                TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by                VARCHAR(48),
    updated_by                VARCHAR(48),
    PRIMARY KEY (order_id, regist_dt),
    CONSTRAINT uk_order_m_regist_corp_mall_store_no UNIQUE (regist_dt, corporation_cd, sales_type_cd, mall_cd, store_cd, order_no),
    CONSTRAINT chk_order_process_status CHECK (order_process_status IN (
        'ORDER_RECEIVED', 'PROCESSING', 'SHIP_READY', 'DELIVERY_READY',
        'SHIPPING', 'DELIVERED', 'CANCELLED', 'HOLD', 'UNMATCHED'
    )),
    CONSTRAINT chk_order_type_cd CHECK (order_type_cd IN ('NORMAL', 'EXCHANGE', 'RETURN', 'CANCEL', 'ETC')),
    CONSTRAINT chk_order_sales_type_cd CHECK (sales_type_cd IN ('B2C_DOMESTIC', 'B2C_OVERSEAS', 'B2B_DOMESTIC', 'B2B_OVERSEAS', 'ETC'))
) PARTITION BY RANGE (regist_dt);

-- 파티션 예: 2025년 1월 ~ 3월, 2026년 3월
CREATE TABLE om_order_m_2025_01 PARTITION OF om_order_m FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE om_order_m_2025_02 PARTITION OF om_order_m FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE om_order_m_2025_03 PARTITION OF om_order_m FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
CREATE TABLE om_order_m_2026_03 PARTITION OF om_order_m FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE INDEX idx_order_m_corporation_regist ON om_order_m (corporation_cd, regist_dt DESC);
CREATE INDEX idx_order_m_regist_dt ON om_order_m (regist_dt DESC);
CREATE INDEX idx_order_m_order_dt ON om_order_m (order_dt DESC);
CREATE INDEX idx_order_m_order_process_status ON om_order_m (order_process_status);
CREATE INDEX idx_order_m_mall_store ON om_order_m (mall_cd, store_cd);
CREATE INDEX idx_order_m_combined_ship_no ON om_order_m (combined_ship_no) WHERE combined_ship_no IS NOT NULL;
-- 목록/건수 조회 시 sales_type_cd 필터 사용 (메뉴별 국내·해외 B2C/B2B·기타)
CREATE INDEX idx_order_m_corp_sales_regist ON om_order_m (corporation_cd, sales_type_cd, regist_dt DESC);
CREATE INDEX idx_order_m_corp_sales_order_dt ON om_order_m (corporation_cd, sales_type_cd, order_dt DESC);
-- 일괄 주문서 처리/이전단계 키 조회용 (order_process_status 필터 포함)
CREATE INDEX idx_order_m_corp_sales_status_regist ON om_order_m (corporation_cd, sales_type_cd, order_process_status, regist_dt DESC);
CREATE INDEX idx_order_m_corp_sales_status_order_dt ON om_order_m (corporation_cd, sales_type_cd, order_process_status, order_dt DESC);
COMMENT ON TABLE om_order_m IS '주문 마스터 (1주문 1행, regist_dt 월별 파티션). 라인은 om_order_item_m';
COMMENT ON COLUMN om_order_m.order_id IS '주문 PK (seq_order_id 1회/주문)';
COMMENT ON COLUMN om_order_m.corporation_cd IS '법인코드';
COMMENT ON COLUMN om_order_m.mall_cd IS '쇼핑몰코드';
COMMENT ON COLUMN om_order_m.store_cd IS '상점코드';
COMMENT ON COLUMN om_order_m.order_dt IS '주문일 (yyyymmdd)';
COMMENT ON COLUMN om_order_m.regist_dt IS '등록일 (yyyymmdd, 파티션 키)';
COMMENT ON COLUMN om_order_m.order_no IS '쇼핑몰 주문번호';
COMMENT ON COLUMN om_order_m.combined_ship_no IS '합포장 번호';
COMMENT ON COLUMN om_order_m.sales_type_cd IS '판매구분';
COMMENT ON COLUMN om_order_m.order_process_status IS '주문처리상태(현재)';
COMMENT ON COLUMN om_order_m.order_process_status_dt IS '해당 상태로 변경된 일시';
COMMENT ON COLUMN om_order_m.order_process_status_by IS '처리자 아이디';
COMMENT ON COLUMN om_order_m.order_type_cd IS '주문타입';
COMMENT ON COLUMN om_order_m.order_info IS '수령인/주문자/메모 등 주문 정보 JSONB. 키: receiverNm, receiverTel, receiverMobile, receiverAddr, receiverAddr2, receiverZip, ordererNm, ordererUserId, ordererTel, ordererMobile, memo, deliveryFee(배송비), paymentMethodCd(결제방법 공통코드 PAYMENT_METHOD), registrationType(등록구분: MANUAL/COLLECTION/EXCEL_UPLOAD). 암호화 필요 필드는 앱 레이어에서 처리.';
COMMENT ON COLUMN om_order_m.created_at IS '생성 일시';
COMMENT ON COLUMN om_order_m.updated_at IS '수정 일시';
COMMENT ON COLUMN om_order_m.created_by IS '생성자';
COMMENT ON COLUMN om_order_m.updated_by IS '수정자';

-- 참고: om_order_m에는 is_deleted 없음 (삭제는 라인 단위 om_order_item_m.is_deleted만 사용). 기존에 컬럼이 있었다면 제거:
-- ALTER TABLE om_order_m DROP COLUMN IF EXISTS is_deleted;

-- 파티션 동적 생성: regist_dt가 속한 월 파티션이 없으면 생성
-- 사용: SELECT ensure_om_order_m_partition_for('2026-03-01'::date);
CREATE OR REPLACE FUNCTION ensure_om_order_m_partition_for(regist_dt DATE)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  partition_name text;
  from_date date;
  to_date date;
BEGIN
  from_date := date_trunc('month', regist_dt)::date;
  to_date := from_date + interval '1 month';
  partition_name := 'om_order_m_' || to_char(regist_dt, 'YYYY_MM');
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF om_order_m FOR VALUES FROM (%L) TO (%L)',
    partition_name, from_date, to_date
  );
END;
$$;
COMMENT ON FUNCTION ensure_om_order_m_partition_for(DATE) IS 'regist_dt가 속한 월의 om_order_m 파티션이 없으면 생성 (IF NOT EXISTS)';

-- 여러 날짜에 대해 파티션 일괄 확인 (일괄 주문서 처리 등에서 1회 호출로 N일 처리)
CREATE OR REPLACE FUNCTION ensure_om_order_m_partition_for_dates(regist_dates DATE[])
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  d date;
  partition_name text;
  from_date date;
  to_date date;
BEGIN
  IF regist_dates IS NULL OR array_length(regist_dates, 1) IS NULL THEN RETURN; END IF;
  FOREACH d IN ARRAY regist_dates
  LOOP
    from_date := date_trunc('month', d)::date;
    to_date := from_date + interval '1 month';
    partition_name := 'om_order_m_' || to_char(d, 'YYYY_MM');
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF om_order_m FOR VALUES FROM (%L) TO (%L)',
      partition_name, from_date, to_date
    );
  END LOOP;
END;
$$;
COMMENT ON FUNCTION ensure_om_order_m_partition_for_dates(DATE[]) IS '여러 날짜가 속한 월의 om_order_m 파티션을 한 번에 확인(없으면 생성)';

-- ============================================================
-- order_info JSONB — registrationType (등록구분)
-- ============================================================
--  키(key)            | 타입   | 필수 | 설명
--  registrationType  | string | N   | 등록구분: MANUAL(수기), COLLECTION(수집), EXCEL_UPLOAD(엑셀업로드)
--
-- ============================================================
-- 과거 마이그레이션 (order_payload → order_info, 이미 적용된 DB는 생략)
-- ============================================================
-- 1) ALTER TABLE om_order_m RENAME COLUMN order_payload TO order_info;
-- 2) 기존 스칼라 컬럼 값을 order_info JSONB에 병합 후 3) receiver_nm, receiver_tel 등 컬럼 DROP.
-- 자세한 스크립트는 이전 migrate_order_payload_to_order_info.sql 내용 참고. 필요 시 docs/dml로 데이터 이전 스크립트 보관.
