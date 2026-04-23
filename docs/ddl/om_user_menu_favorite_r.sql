-- BO 사용자 메뉴 즐겨찾기
-- 테이블명: om_user_menu_favorite_r
-- docs/08-DB-표준.md 준수
--
-- 용도: 로그인 사용자별 BO 화면(om_menu_m.menu_id) 즐겨찾기, 최대 5건, disp_seq로 정렬.
--       대시보드(home)는 등록 대상에서 제외(애플리케이션 규칙).
--
-- 선행: docs/ddl/om_user_m.sql, docs/ddl/om_menu_m.sql

CREATE TABLE om_user_menu_favorite_r (
    user_id     VARCHAR(48)     NOT NULL,
    menu_id     VARCHAR(48)     NOT NULL,
    disp_seq    INTEGER         NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_om_user_menu_favorite_r PRIMARY KEY (user_id, menu_id),
    CONSTRAINT fk_om_user_menu_favorite_r_user
        FOREIGN KEY (user_id)
        REFERENCES om_user_m (user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_om_user_menu_favorite_r_menu
        FOREIGN KEY (menu_id)
        REFERENCES om_menu_m (menu_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_om_user_menu_favorite_r_user_disp
    ON om_user_menu_favorite_r (user_id, disp_seq);

COMMENT ON TABLE om_user_menu_favorite_r IS 'BO 사용자 메뉴 즐겨찾기(최대 5건, 순서)';
COMMENT ON COLUMN om_user_menu_favorite_r.user_id IS '사용자 ID (om_user_m.user_id)';
COMMENT ON COLUMN om_user_menu_favorite_r.menu_id IS '메뉴 ID (om_menu_m.menu_id, 권한·탭 id와 동일)';
COMMENT ON COLUMN om_user_menu_favorite_r.disp_seq IS '표시 순서(작을수록 위)';
