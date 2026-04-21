-- 상품 세트 구성품 테이블 (세트 구성품 정보 분리)
-- 테이블명: OM_PRODUCT_SET_COMPONENT
-- product_type = 'SET' 인 상품의 구성품 목록

CREATE TABLE OM_PRODUCT_SET_COMPONENT (
    product_id             VARCHAR(48)    NOT NULL,
    component_product_id   VARCHAR(48)    NOT NULL,
    component_qty          INTEGER        NOT NULL DEFAULT 1,
    sort_order             INTEGER        NOT NULL DEFAULT 0,
    created_at             TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id, component_product_id),
    CONSTRAINT fk_set_component_product FOREIGN KEY (product_id) REFERENCES OM_PRODUCT_M (product_id) ON DELETE CASCADE,
    CONSTRAINT fk_set_component_component FOREIGN KEY (component_product_id) REFERENCES OM_PRODUCT_M (product_id) ON DELETE CASCADE
);

CREATE INDEX idx_product_set_component_product_id ON OM_PRODUCT_SET_COMPONENT (product_id);

COMMENT ON TABLE OM_PRODUCT_SET_COMPONENT IS '상품 세트 구성품 (OM_PRODUCT_M SET 1:N)';
COMMENT ON COLUMN OM_PRODUCT_SET_COMPONENT.product_id IS '세트 상품 아이디';
COMMENT ON COLUMN OM_PRODUCT_SET_COMPONENT.component_product_id IS '구성품 상품 아이디';
COMMENT ON COLUMN OM_PRODUCT_SET_COMPONENT.component_qty IS '구성품 수량';
