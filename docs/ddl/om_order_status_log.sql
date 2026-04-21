-- 주문 상태 변경 이력
-- 테이블명: om_order_status_log
--
-- 주문처리상태 등 각종 상태 변경 시마다 1건 INSERT. 현재 상태는 om_order_m의 order_process_status 등 3컬럼으로 조회.
-- 설계: docs/ddl/주문_데이터베이스_설계.md §2
-- 대용량 시 status_dt 기준 월별 파티셔닝 적용 가능.
--
-- 정책: 주문 등록(수기·엑셀 일괄) 시 ETC/REGISTERED 로그는 남기지 않음. ORDER_PROCESS/ORDER_RECEIVED만 기록. docs/menu/주문관리.md §9.5.

CREATE TABLE om_order_status_log (
    id              BIGSERIAL      PRIMARY KEY,
    order_id        BIGINT         NOT NULL,
    regist_dt       DATE           NOT NULL,
    status_kind     VARCHAR(30)    NOT NULL,
    status_value    VARCHAR(30)    NOT NULL,
    status_dt       TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status_by       VARCHAR(48),
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_status_kind CHECK (status_kind IN ('ORDER_PROCESS', 'SHIP_STATUS', 'DELIVERY_STATUS', 'ETC'))
);
-- 참고: om_order_m은 (order_id, regist_dt, line_no) PK이므로 (order_id, regist_dt)만으로 FK 불가. order_id·regist_dt는 논리적 참조.

CREATE INDEX idx_order_status_log_order_id ON om_order_status_log (order_id);
CREATE INDEX idx_order_status_log_regist_dt ON om_order_status_log (regist_dt DESC);
CREATE INDEX idx_order_status_log_status_dt ON om_order_status_log (status_dt DESC);
CREATE INDEX idx_order_status_log_kind_value ON om_order_status_log (status_kind, status_value);

COMMENT ON TABLE om_order_status_log IS '주문 상태 변경 이력 (현재 상태는 om_order_m, 이력·감사는 본 테이블)';
COMMENT ON COLUMN om_order_status_log.order_id IS '주문 PK (om_order_m.order_id)';
COMMENT ON COLUMN om_order_status_log.regist_dt IS '주문 등록일 (파티셔닝·조회 보조)';
COMMENT ON COLUMN om_order_status_log.status_kind IS '상태 종류 (ORDER_PROCESS: 주문처리상태, SHIP_STATUS: 출고상태 등)';
COMMENT ON COLUMN om_order_status_log.status_value IS '상태 값 (ORDER_RECEIVED, SHIP_READY, DELIVERED 등)';
COMMENT ON COLUMN om_order_status_log.status_dt IS '해당 상태로 변경된 일시';
COMMENT ON COLUMN om_order_status_log.status_by IS '처리자 아이디';
