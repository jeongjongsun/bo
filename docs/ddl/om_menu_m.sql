-- 메뉴 마스터 (OMS / 백오피스 공통)
-- 테이블명: om_menu_m (표준: 단수형·소문자·snake_case)
-- docs/08-DB-표준.md 준수
--
-- 용도: OM·BO 애플리케이션의 사이드/탑 메뉴 트리를 DB로 관리.
--       로그인 후 시스템별 메뉴를 메모리(세션·캐시)에 적재해 사용하고,
--       관리 화면에서는 본 테이블을 CRUD한다.
--
-- 최상위 트리 노드(OM, BO 등): om_code_m 에 main_cd = 'SYSTEM' 인 행으로 정의하고,
--       본 테이블의 (system_main_cd, system_sub_cd)가 해당 코드를 참조한다.
--       시드: docs/dml/om_code_m_data_system.sql (CODE/SYSTEM, SYSTEM/OM·BO)
--       BO 메뉴 시드(사이드바 반영): docs/dml/om_menu_m_seed_bo_from_sidebar.sql
--
-- 계층: 인접 리스트 모델. parent_menu_id IS NULL 이면 해당 시스템 코드 바로 아래 1depth 메뉴.

CREATE TABLE om_menu_m (
    menu_id          VARCHAR(48)     NOT NULL,
    system_main_cd   VARCHAR(50)     NOT NULL DEFAULT 'SYSTEM',
    system_sub_cd    VARCHAR(50)     NOT NULL,
    parent_menu_id   VARCHAR(48),
    menu_nm          JSONB           NOT NULL,
    menu_url         VARCHAR(500),
    is_active        BOOLEAN         NOT NULL DEFAULT true,
    icon             VARCHAR(128),
    disp_seq         INTEGER         NOT NULL DEFAULT 0,
    menu_info        JSONB           NOT NULL DEFAULT '{}',
    remark           VARCHAR(500),
    created_at       TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by       VARCHAR(48),
    updated_by       VARCHAR(48),
    is_deleted       BOOLEAN         NOT NULL DEFAULT false,
    CONSTRAINT pk_om_menu_m PRIMARY KEY (menu_id),
    CONSTRAINT fk_om_menu_m_system_code
        FOREIGN KEY (system_main_cd, system_sub_cd)
        REFERENCES om_code_m (main_cd, sub_cd),
    CONSTRAINT fk_om_menu_m_parent
        FOREIGN KEY (parent_menu_id)
        REFERENCES om_menu_m (menu_id)
        ON DELETE RESTRICT,
    CONSTRAINT chk_om_menu_m_not_self_parent
        CHECK (parent_menu_id IS NULL OR parent_menu_id <> menu_id)
);

CREATE INDEX idx_om_menu_m_system_parent
    ON om_menu_m (system_main_cd, system_sub_cd, parent_menu_id)
    WHERE is_deleted = false;

CREATE INDEX idx_om_menu_m_parent
    ON om_menu_m (parent_menu_id)
    WHERE is_deleted = false;

CREATE INDEX idx_om_menu_m_disp
    ON om_menu_m (system_main_cd, system_sub_cd, disp_seq)
    WHERE is_deleted = false;

COMMENT ON TABLE om_menu_m IS '메뉴 마스터 (OM/BO 트리, 계층 관리)';
COMMENT ON COLUMN om_menu_m.menu_id IS '메뉴 코드(PK). 자동채번·전역 유일. OM/BO 구분: 접두 규칙 권장 예) MNU_O_000001 / MNU_B_000001 (애플리케이션에서 system_sub_cd별 시퀀스)';
COMMENT ON COLUMN om_menu_m.system_main_cd IS '시스템 구분 코드 그룹. 기본값 SYSTEM (om_code_m.main_cd)';
COMMENT ON COLUMN om_menu_m.system_sub_cd IS '시스템 구분 코드값 (om_code_m.sub_cd). SYSTEM 그룹의 OM, BO 등과 매핑되어 최상위 트리 루트와 대응';
COMMENT ON COLUMN om_menu_m.parent_menu_id IS '부모 메뉴 ID. NULL이면 해당 system 하위 최상위(1depth)';
COMMENT ON COLUMN om_menu_m.menu_nm IS '메뉴명 JSONB 다국어 {"ko":"...","en":"..."} (om_code_m.code_nm 패턴과 동일)';
COMMENT ON COLUMN om_menu_m.menu_url IS '메뉴 URL (라우트 경로 또는 외부 링크. 폴더형 메뉴는 NULL 가능)';
COMMENT ON COLUMN om_menu_m.is_active IS '사용 여부';
COMMENT ON COLUMN om_menu_m.icon IS '아이콘 식별자(아이콘 라이브러리 클래스명·키 등)';
COMMENT ON COLUMN om_menu_m.disp_seq IS '같은 부모 내 표시 순서(오름차순 권장)';
COMMENT ON COLUMN om_menu_m.menu_info IS '확장 속성 JSONB (아래 구조 권장)';
COMMENT ON COLUMN om_menu_m.remark IS '관리용 비고';
COMMENT ON COLUMN om_menu_m.created_at IS '최초 생성 시각';
COMMENT ON COLUMN om_menu_m.updated_at IS '최종 수정 시각';
COMMENT ON COLUMN om_menu_m.created_by IS '생성자 식별자';
COMMENT ON COLUMN om_menu_m.updated_by IS '수정자 식별자';
COMMENT ON COLUMN om_menu_m.is_deleted IS '소프트 삭제 여부';

-- ============================================================
-- menu_info JSONB 구조 정의 (권장·선택)
-- ============================================================
--
--  키(key)               | 타입       | 필수 | 설명
-- -----------------------|-----------|------|------------------------------------------
--  menu_type             | string    | N    | PAGE | GROUP | LINK | EXTERNAL
--  perm_code             | string    | N    | 향후 메뉴·API 권한 매핑용 고정 코드
--  open_new_tab          | boolean   | N    | 새 창 여부
--  route_key             | string    | N    | 프론트 라우트 키(경로와 분리 시)
--  external_url          | string    | N    | EXTERNAL 타입일 때 실제 URL
--  badge_key             | string    | N    | 알림 배지 연동 키
--  meta                  | object    | N    | 기타 UI 메타
--
-- 메뉴 코드 채번 예시 (애플리케이션 규칙):
--   - OM:  prefix + system_sub_cd(예: OM) + 일련번호
--   - BO:  prefix + system_sub_cd(예: BO) + 일련번호
--   DB 시퀀스를 테이블별로 두거나, om_config_m 등 중앙 채번 테이블과 조합 가능.
