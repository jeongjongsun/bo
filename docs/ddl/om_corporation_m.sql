-- 법인(화주사) 메인 테이블 생성 DDL
-- 테이블명: OM_CORPORATION_M
--
-- [corporation_info JSONB 구조]
--
-- 기본 부가정보
--   business_no      : STRING  - 사업자등록번호
--   ceo_nm           : STRING  - 대표자명
--   address          : STRING  - 주소
--   tel_no           : STRING  - 대표전화
--   fax_no           : STRING  - 팩스번호
--   email            : STRING  - 대표이메일
--   homepage_url     : STRING  - 홈페이지
--   remark           : STRING  - 비고
--
-- ※ 법인별 커스텀 키를 자유롭게 추가 가능

-- corporation_cd 는 PRIMARY KEY 로 유일성 보장. 동시 등록 시 충돌은 애플리케이션에서 재채번·재INSERT 로 처리.
-- 테이블 생성
CREATE TABLE OM_CORPORATION_M (
    corporation_cd   VARCHAR(20)    PRIMARY KEY,
    corporation_nm   VARCHAR(200)   NOT NULL,
    corporation_info JSONB          DEFAULT '{}',
    is_active        BOOLEAN        NOT NULL DEFAULT true,
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by       VARCHAR(48),
    updated_by       VARCHAR(48)
);

-- 인덱스
CREATE INDEX idx_corporation_is_active ON OM_CORPORATION_M (is_active);

-- 테이블 코멘트
COMMENT ON TABLE OM_CORPORATION_M IS '법인(화주사) 메인 테이블';
COMMENT ON COLUMN OM_CORPORATION_M.corporation_cd IS '법인 코드';
COMMENT ON COLUMN OM_CORPORATION_M.corporation_nm IS '법인 명';
COMMENT ON COLUMN OM_CORPORATION_M.corporation_info IS '법인 부가정보 (JSONB: business_no, ceo_nm, address, tel_no, fax_no, email, homepage_url, remark)';
COMMENT ON COLUMN OM_CORPORATION_M.is_active IS '사용 여부';
COMMENT ON COLUMN OM_CORPORATION_M.created_at IS '생성 일시';
COMMENT ON COLUMN OM_CORPORATION_M.updated_at IS '수정 일시';
COMMENT ON COLUMN OM_CORPORATION_M.created_by IS '생성자';
COMMENT ON COLUMN OM_CORPORATION_M.updated_by IS '수정자';
