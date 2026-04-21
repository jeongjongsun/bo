-- 주문 라인 (1주문 N행, 상품 단위)
-- 테이블명: om_order_item_m
--
-- om_order_m(order_id, regist_dt) 1 : N om_order_item_m
-- 그리드·목록은 om_order_m JOIN om_order_item_m 로 조회.

CREATE TABLE om_order_item_m (
    order_id             BIGINT         NOT NULL,
    regist_dt            DATE           NOT NULL,
    line_no              INTEGER        NOT NULL,
    item_order_no        VARCHAR(100),
    product_cd           VARCHAR(50),
    product_nm           VARCHAR(200),
    line_qty             INTEGER        NOT NULL DEFAULT 1,
    line_amount          NUMERIC(15,2)  NOT NULL DEFAULT 0,
    line_discount_amount NUMERIC(15,2)  NOT NULL DEFAULT 0,
    line_payload         JSONB          DEFAULT '{}',
    is_deleted           BOOLEAN        NOT NULL DEFAULT false,
    created_at           TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by           VARCHAR(48),
    updated_by           VARCHAR(48),
    PRIMARY KEY (order_id, line_no),
    CONSTRAINT fk_order_item_m_order FOREIGN KEY (order_id, regist_dt)
        REFERENCES om_order_m (order_id, regist_dt) ON DELETE CASCADE,
    CONSTRAINT chk_order_item_m_line_no CHECK (line_no > 0),
    CONSTRAINT chk_order_item_m_line_qty CHECK (line_qty > 0)
);

CREATE INDEX idx_order_item_m_order_regist ON om_order_item_m (order_id, regist_dt);
CREATE INDEX idx_order_item_m_product_cd ON om_order_item_m (product_cd) WHERE product_cd IS NOT NULL;
CREATE INDEX idx_order_item_m_is_deleted ON om_order_item_m (is_deleted) WHERE is_deleted = false;
CREATE INDEX idx_order_item_m_deleted ON om_order_item_m (order_id, regist_dt) WHERE is_deleted = true;
CREATE INDEX idx_order_item_m_order_regist_not_deleted ON om_order_item_m (order_id, regist_dt) WHERE is_deleted = false;

COMMENT ON TABLE om_order_item_m IS '주문 라인 (1주문 N행, 상품 단위)';
COMMENT ON COLUMN om_order_item_m.order_id IS '주문 PK (FK → om_order_m)';
COMMENT ON COLUMN om_order_item_m.regist_dt IS '등록일 (FK → om_order_m, 파티션 보조)';
COMMENT ON COLUMN om_order_item_m.line_no IS '라인 번호 (주문 내 순번)';
COMMENT ON COLUMN om_order_item_m.item_order_no IS '상품별 주문번호 (쇼핑몰에서 생성)';
COMMENT ON COLUMN om_order_item_m.product_cd IS '상품코드';
COMMENT ON COLUMN om_order_item_m.product_nm IS '상품명';
COMMENT ON COLUMN om_order_item_m.line_qty IS '라인 구매 수량';
COMMENT ON COLUMN om_order_item_m.line_amount IS '라인 구매 금액';
COMMENT ON COLUMN om_order_item_m.line_discount_amount IS '라인 할인 금액';
COMMENT ON COLUMN om_order_item_m.line_payload IS '라인별 옵션·쇼핑몰 원본 등 확장용 JSONB';
COMMENT ON COLUMN om_order_item_m.is_deleted IS '삭제 여부 (라인 단위 소프트 삭제)';
COMMENT ON COLUMN om_order_item_m.created_at IS '생성 일시';
COMMENT ON COLUMN om_order_item_m.updated_at IS '수정 일시';
COMMENT ON COLUMN om_order_item_m.created_by IS '생성자';
COMMENT ON COLUMN om_order_item_m.updated_by IS '수정자';

-- ============================================================
-- line_payload JSONB 구조 정의
-- ============================================================
--
--  키(key)         | 타입   | 필수 | 설명
-- -----------------|--------|------|-------------------------
--  option_nm       | string | N    | 옵션명
--  mall_product_cd | string | N    | 쇼핑몰 상품코드
--  mall_sku_id     | string | N    | 쇼핑몰 SKU ID
--  is_gift         | boolean| N    | 사은품 여부 (해당 라인이 사은품일 때 true)
--
-- 예시: { "option_nm": "색상:빨강", "mall_product_cd": "MALL-P-001" }
-- 예시(사은품): { "is_gift": true }
