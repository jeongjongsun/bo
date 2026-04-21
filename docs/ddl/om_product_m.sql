-- 상품 메인 테이블 생성 DDL
-- 테이블명: OM_PRODUCT_M
--
-- [UI 필수 항목] 편집 폼에서 NOT NULL이며 사용자 입력인 컬럼 → 필수 표시(*, required)
--   product_cd, product_nm, product_type (product_id는 PK로 수정 불가)
--   프론트: ProductEditPage.tsx REQUIRED_FIELDS_BASIC
--
-- [product_info JSONB] 부가정보만 저장 (단위/바코드·세트구성품은 별도 테이블)
--   product_en_nm    : STRING   - 상품 영문명
--   category_cd      : STRING   - 카테고리 코드
--   brand_cd         : STRING   - 브랜드 코드
--   cost_price       : NUMBER   - 원가(매입가)
--   supply_price     : NUMBER   - 공급가
--   tax_type         : STRING   - 과세유형 (TAXABLE / TAX_FREE / ZERO)
--   safety_stock_qty : NUMBER   - 안전재고 수량
--   min_order_qty    : NUMBER   - 최소주문 수량
--   max_order_qty    : NUMBER   - 최대주문 수량
--   sort_order       : NUMBER   - 정렬순서
--   description      : STRING   - 상품 설명
--   image_url        : STRING   - 대표 이미지 URL
--   remark           : STRING   - 비고
-- 단위/바코드 → OM_PRODUCT_UNIT, 세트 구성품 → OM_PRODUCT_SET_COMPONENT
--
-- [sort_order] product_info.sort_order = 정렬용. 신규/벌크 등록 시 시퀀스(nextval)로 부여, 수정 시 변경 안 함.
CREATE SEQUENCE seq_product_sort_order START 1;

-- 테이블 생성
CREATE TABLE OM_PRODUCT_M (
    product_id      VARCHAR(48)    PRIMARY KEY,
    corporation_cd  VARCHAR(20)    NOT NULL,
    product_cd      VARCHAR(50)    NOT NULL,
    product_nm      VARCHAR(200)   NOT NULL,
    product_type    VARCHAR(20)    NOT NULL DEFAULT 'SINGLE',
    sale_price      NUMERIC(15,2)  NOT NULL DEFAULT 0,
    stock_qty       INTEGER        NOT NULL DEFAULT 0,
    is_gift         BOOLEAN        NOT NULL DEFAULT false,
    is_sale         BOOLEAN        NOT NULL DEFAULT true,
    is_display      BOOLEAN        NOT NULL DEFAULT true,
    product_info    JSONB          DEFAULT '{}',
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(48),
    updated_by      VARCHAR(48),
    is_deleted      BOOLEAN        NOT NULL DEFAULT false
);

-- 제약조건
ALTER TABLE OM_PRODUCT_M ADD CONSTRAINT uk_product_corporation_product_cd UNIQUE (corporation_cd, product_cd);
ALTER TABLE OM_PRODUCT_M ADD CONSTRAINT chk_product_type CHECK (product_type IN ('SINGLE', 'SET'));

-- 인덱스
CREATE INDEX idx_product_corporation_cd ON OM_PRODUCT_M (corporation_cd);
-- 법인별 상품 목록 조회 시 ORDER BY product_id DESC 지원 (선택). 없어도 PK로 정렬 가능.
CREATE INDEX idx_product_corporation_product_id ON OM_PRODUCT_M (corporation_cd, product_id DESC);
CREATE INDEX idx_product_product_nm ON OM_PRODUCT_M (product_nm);
CREATE INDEX idx_product_created_at ON OM_PRODUCT_M (created_at DESC);
CREATE INDEX idx_product_product_info ON OM_PRODUCT_M USING GIN (product_info);
-- 목록/export-full 조회 정렬 최적화 (ORDER BY sort_order, created_at, product_id / WHERE corporation_cd, is_deleted = false)
CREATE INDEX IF NOT EXISTS idx_product_m_list_export ON om_product_m (corporation_cd, is_deleted, ((product_info->>'sort_order')::int) DESC NULLS LAST, created_at DESC, product_id) WHERE is_deleted = false;
-- 법인+상품코드로 product_id 조회 (엑셀 업로드/재업로드 시)
CREATE INDEX IF NOT EXISTS idx_product_m_corp_cd_active ON om_product_m (corporation_cd, product_cd) WHERE is_deleted = false;

-- 테이블 코멘트
COMMENT ON TABLE OM_PRODUCT_M IS '상품 메인 테이블';
COMMENT ON COLUMN OM_PRODUCT_M.product_id IS '상품 아이디';
COMMENT ON COLUMN OM_PRODUCT_M.corporation_cd IS '화주사 코드';
COMMENT ON COLUMN OM_PRODUCT_M.product_cd IS '상품 코드';
COMMENT ON COLUMN OM_PRODUCT_M.product_nm IS '상품 명';
COMMENT ON COLUMN OM_PRODUCT_M.product_type IS '상품 유형 (SINGLE: 단일상품, SET: 세트상품)';
COMMENT ON COLUMN OM_PRODUCT_M.sale_price IS '판매가';
COMMENT ON COLUMN OM_PRODUCT_M.stock_qty IS '재고 수량';
COMMENT ON COLUMN OM_PRODUCT_M.is_gift IS '사은품 여부';
COMMENT ON COLUMN OM_PRODUCT_M.is_sale IS '판매 여부';
COMMENT ON COLUMN OM_PRODUCT_M.is_display IS '전시 여부';
COMMENT ON COLUMN OM_PRODUCT_M.product_info IS '상품 부가정보 (JSONB: product_en_nm, category_cd, brand_cd, cost_price, supply_price, tax_type, safety_stock_qty, min_order_qty, max_order_qty, sort_order, description, image_url, remark)';
COMMENT ON COLUMN OM_PRODUCT_M.created_at IS '생성 일시';
COMMENT ON COLUMN OM_PRODUCT_M.updated_at IS '수정 일시';
COMMENT ON COLUMN OM_PRODUCT_M.created_by IS '생성자';
COMMENT ON COLUMN OM_PRODUCT_M.updated_by IS '수정자';
COMMENT ON COLUMN OM_PRODUCT_M.is_deleted IS '삭제 여부';
