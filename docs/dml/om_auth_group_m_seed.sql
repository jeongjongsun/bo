-- 권한 그룹 샘플 (사용자 등록·그리드 검증에 필요). docs/ddl/om_auth_group_m.sql 적용 후 선택 실행.
-- 기존 om_user_m 예시의 auth_group 값과 맞춤.

INSERT INTO om_auth_group_m (
    auth_group_cd,
    auth_group_nm,
    auth_group_info,
    is_active,
    sort_seq,
    remark
)
SELECT
    'SUPER_ADMIN',
    '슈퍼 관리자',
    '{}'::jsonb,
    true,
    0,
    'seed'
WHERE NOT EXISTS (
    SELECT 1 FROM om_auth_group_m WHERE auth_group_cd = 'SUPER_ADMIN' AND COALESCE(is_deleted, false) = false
);
