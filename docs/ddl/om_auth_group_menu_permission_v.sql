-- 권한 그룹-메뉴 액션 권한 행 단위 조회용 VIEW
-- (menu_id, action, allowed) 형태로 언피벗된 결과 제공
--
-- PostgreSQL 구현:
--   CROSS JOIN LATERAL + VALUES 구문을 사용한다.
--   다른 DBMS로 이식 시 UNPIVOT 또는 UNION ALL 기반으로 동일 뷰를 재작성한다.

CREATE OR REPLACE VIEW om_auth_group_menu_permission_v AS
SELECT r.auth_group_cd,
       r.system_main_cd,
       r.system_sub_cd,
       r.menu_id,
       perm.action,
       perm.allowed
  FROM om_auth_group_menu_r r
  CROSS JOIN LATERAL (
      VALUES
          ('view', COALESCE(r.can_view, false)),
          ('create', COALESCE(r.can_create, false)),
          ('update', COALESCE(r.can_update, false)),
          ('delete', COALESCE(r.can_delete, false)),
          ('excel_download', COALESCE(r.can_excel_download, false)),
          ('approve', COALESCE(r.can_approve, false))
  ) AS perm(action, allowed)
 WHERE COALESCE(r.is_deleted, false) = false;
