-- 공통코드 데이터: 시스템 구분 (메뉴관리 최상위 OM/BO 등)
-- 하이어라키: CODE → SYSTEM 그룹 정의 → SYSTEM 하위에 OM, BO
--
-- 실행 순서:
--   1) docs/ddl/om_code_m.sql 적용 후 본 스크립트 실행
--   2) docs/ddl/om_menu_m.sql 적용 및 메뉴 INSERT 시 (system_main_cd, system_sub_cd)는
--      본 데이터의 ('SYSTEM','OM'), ('SYSTEM','BO') 등과 일치해야 함 (FK)

-- 1) 그룹 정의 (CODE 하위)
INSERT INTO OM_CODE_M (main_cd, sub_cd, code_nm, code_info) VALUES
(
    'CODE',
    'SYSTEM',
    '{"ko":"시스템구분","en":"System","ja":"システム","vi":"Hệ thống"}',
    '{"use_yn":"Y","disp_seq":13}'
)
ON CONFLICT (main_cd, sub_cd) DO UPDATE SET
    code_nm = EXCLUDED.code_nm,
    code_info = EXCLUDED.code_info,
    updated_at = CURRENT_TIMESTAMP;

-- 2) 시스템 상세 코드 (SYSTEM 하위, om_menu_m.system_main_cd/system_sub_cd 연동)
INSERT INTO OM_CODE_M (main_cd, sub_cd, code_nm, code_info) VALUES
(
    'SYSTEM',
    'OM',
    '{"ko":"OMS","en":"OMS","ja":"OMS","vi":"OMS"}',
    '{"use_yn":"Y","disp_seq":1}'
),
(
    'SYSTEM',
    'BO',
    '{"ko":"백오피스","en":"Back Office","ja":"バックオフィス","vi":"Back office"}',
    '{"use_yn":"Y","disp_seq":2}'
)
ON CONFLICT (main_cd, sub_cd) DO UPDATE SET
    code_nm = EXCLUDED.code_nm,
    code_info = EXCLUDED.code_info,
    updated_at = CURRENT_TIMESTAMP;
