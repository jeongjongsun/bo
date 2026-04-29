-- 1) 쇼핑몰 정보 마스터
-- 테이블명: om_mall_m
--
-- mall_cd(PK): 비즈니스 키, 채번 형식 MALL-일련번호4자리 (예: MALL-0001). 애플리케이션에서 부여.
-- mall_nm, mall_info(부가: 쇼핑몰 URL·판매구분 등), api_connection_info(API 연동 상세 JSONB)
-- 소프트 삭제: is_deleted = true 인 행은 목록·FK 신규 연결에서 제외(애플리케이션 규칙).
--
-- 기존 mall_id(BIGSERIAL) 구조에서 전환하는 경우: 데이터 이관·FK 검토 후 본 DDL로 재구축하거나 별도 마이그레이션 스크립트를 사용합니다.

CREATE TABLE om_mall_m (
    mall_cd              VARCHAR(20)    NOT NULL,
    mall_nm              VARCHAR(200)   NOT NULL,
    mall_info            JSONB          NOT NULL DEFAULT '{}',
    api_connection_info  JSONB          NOT NULL DEFAULT '{}',
    is_active            BOOLEAN        NOT NULL DEFAULT true,
    is_deleted           BOOLEAN        NOT NULL DEFAULT false,
    created_at           TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by           VARCHAR(48),
    updated_by           VARCHAR(48),
    CONSTRAINT pk_om_mall_m PRIMARY KEY (mall_cd)
);

CREATE INDEX idx_om_mall_m_active_list ON om_mall_m (is_active)
    WHERE is_deleted = false;

COMMENT ON TABLE om_mall_m IS '쇼핑몰 정보 마스터 (주문 수집 대상 쇼핑몰)';
COMMENT ON COLUMN om_mall_m.mall_cd IS '쇼핑몰코드 (PK, MALL-#### 형식 권장)';
COMMENT ON COLUMN om_mall_m.mall_nm IS '쇼핑몰명';
COMMENT ON COLUMN om_mall_m.mall_info IS '쇼핑몰 부가정보 (JSONB: mall_url, sales_type_cd 등)';
COMMENT ON COLUMN om_mall_m.api_connection_info IS 'API 연결 정보 (엔드포인트·인증·버전 등 JSONB)';
COMMENT ON COLUMN om_mall_m.is_active IS '사용 여부';
COMMENT ON COLUMN om_mall_m.is_deleted IS '소프트 삭제 여부';
COMMENT ON COLUMN om_mall_m.created_at IS '생성 일시';
COMMENT ON COLUMN om_mall_m.updated_at IS '수정 일시';
COMMENT ON COLUMN om_mall_m.created_by IS '생성자';
COMMENT ON COLUMN om_mall_m.updated_by IS '수정자';

-- ============================================================
-- mall_info JSONB 구조 정의 (권장·선택)
-- ============================================================
--
--  키(key)           | 타입    | 필수 | 설명                    | 예시 / 비고
-- -------------------|--------|------|-------------------------|------------------
--  mall_url           | string | N    | 쇼핑몰 URL              | "https://mall.example.com"
--  sales_type_cd      | string | N    | 쇼핑몰 판매·채널 구분   | 공통코드 ORDER_CHANNEL_TYPE 하위 sub_cd 와 동일 값 권장 (docs/dml/cm_code_m_insert_order_channel_type.sql 등)
--
-- 예시:
-- { "mall_url": "https://mall.example.com", "sales_type_cd": "B2C_DOMESTIC" }

-- ============================================================
-- api_connection_info JSONB 구조 정의 (권장·선택)
-- ============================================================
--
--  키(key)           | 타입    | 필수 | 설명                    | 예시 / 비고
-- -------------------|--------|------|-------------------------|------------------
--  base_url           | string | N    | API 베이스 URL          | "https://api.mall.example.com"
--  auth_type          | string | N    | 인증 방식 키            | "OAUTH2", "API_KEY"
--  api_version        | string | N    | 연동 API 버전           | "v1"
--  (기타)             |        | N    | 채널별 확장 필드         | 스펙에 맞게 추가
--
-- 예시:
-- { "base_url": "https://api.mall.example.com", "auth_type": "API_KEY", "api_version": "v1" }
