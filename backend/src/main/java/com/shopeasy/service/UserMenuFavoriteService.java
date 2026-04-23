package com.shopeasy.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopeasy.dto.AuditLogCommand;
import com.shopeasy.api.MessageKeys;
import com.shopeasy.dto.MenuManageRow;
import com.shopeasy.mapper.OmMenuMMapper;
import com.shopeasy.mapper.OmUserMenuFavoriteRMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserMenuFavoriteService {

    public static final int MAX_FAVORITES = 5;
    public static final String HOME_MENU_ID = "home";
    private static final int BULK_DELETE_CHUNK_SIZE = 500;

    private static final String BO_MAIN = BoSidebarMenuService.BO_SYSTEM_MAIN;
    private static final String BO_SUB = BoSidebarMenuService.BO_SYSTEM_SUB;

    private final OmUserMenuFavoriteRMapper favoriteMapper;
    private final OmMenuMMapper menuMMapper;
    private final ObjectMapper objectMapper;
    private final AuditService auditService;

    public UserMenuFavoriteService(
            OmUserMenuFavoriteRMapper favoriteMapper,
            OmMenuMMapper menuMMapper,
            ObjectMapper objectMapper,
            AuditService auditService) {
        this.favoriteMapper = favoriteMapper;
        this.menuMMapper = menuMMapper;
        this.objectMapper = objectMapper;
        this.auditService = auditService;
    }

    /**
     * DB 저장 순서대로, 허용 메뉴와 교집합. home 제외.
     */
    @Transactional(readOnly = true)
    public List<String> listVisibleOrdered(String userId, List<String> allowedMenuIds) {
        if (userId == null || userId.isBlank()) {
            return List.of();
        }
        List<String> stored = favoriteMapper.selectMenuIdsOrdered(userId.trim());
        if (stored == null || stored.isEmpty()) {
            return List.of();
        }
        Set<String> allowed = toAllowedSet(allowedMenuIds);
        List<String> out = new ArrayList<>();
        for (String mid : stored) {
            if (HOME_MENU_ID.equals(mid)) {
                continue;
            }
            if (allowed != null && !allowed.contains(mid)) {
                continue;
            }
            out.add(mid);
        }
        return out;
    }

    @Transactional
    public void add(String userId, String menuId, List<String> allowedMenuIds) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException(MessageKeys.ERROR_BAD_REQUEST);
        }
        String uid = userId.trim();
        String mid = requireMenuId(menuId);
        if (HOME_MENU_ID.equals(mid)) {
            throw new IllegalArgumentException(MessageKeys.FAVORITES_HOME_NOT_ALLOWED);
        }
        Set<String> allowed = toAllowedSet(allowedMenuIds);
        if (allowed != null && !allowed.contains(mid)) {
            throw new IllegalArgumentException(MessageKeys.FAVORITES_MENU_NOT_ALLOWED);
        }
        MenuManageRow row = menuMMapper.selectOne(mid);
        if (row == null || Boolean.FALSE.equals(row.getIsActive())) {
            throw new IllegalArgumentException(MessageKeys.MENUS_NOT_FOUND);
        }
        if (!BO_MAIN.equals(row.getSystemMainCd()) || !BO_SUB.equals(row.getSystemSubCd())) {
            throw new IllegalArgumentException(MessageKeys.FAVORITES_MENU_NOT_ALLOWED);
        }
        if (!"PAGE".equalsIgnoreCase(nullToEmpty(row.getMenuType()))) {
            throw new IllegalArgumentException(MessageKeys.FAVORITES_NOT_PAGE);
        }
        if (row.getMenuUrl() == null || row.getMenuUrl().isBlank()) {
            throw new IllegalArgumentException(MessageKeys.FAVORITES_NOT_PAGE);
        }

        if (favoriteMapper.existsByUserAndMenu(uid, mid)) {
            throw new IllegalArgumentException(MessageKeys.FAVORITES_ALREADY);
        }
        int cnt = favoriteMapper.countByUser(uid);
        if (cnt >= MAX_FAVORITES) {
            throw new IllegalArgumentException(MessageKeys.FAVORITES_LIMIT);
        }
        List<String> current = favoriteMapper.selectMenuIdsOrdered(uid);
        Integer maxSeq = favoriteMapper.selectMaxDispSeq(uid);
        int nextSeq = (maxSeq != null ? maxSeq : -1) + 1;
        int inserted = favoriteMapper.insert(uid, mid, nextSeq);
        if (inserted != 1) {
            throw new IllegalStateException("favorite insert failed");
        }
        recordFavoriteAddAudit(uid, mid, nextSeq, row, current);
    }

    @Transactional
    public void remove(String userId, String menuId) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException(MessageKeys.ERROR_BAD_REQUEST);
        }
        String uid = userId.trim();
        String mid = requireMenuId(menuId);
        int n = favoriteMapper.delete(uid, mid);
        if (n == 0) {
            throw new IllegalArgumentException(MessageKeys.FAVORITES_NOT_FOUND);
        }
        recordFavoriteRemoveAudit(uid, mid);
    }

    /** 권한 그룹 BO 메뉴 저장 후: 해당 그룹 사용자의 불허 즐겨찾기 삭제. */
    @Transactional
    public void cleanupAfterAuthGroupMenuSave(String authGroupCd, List<String> allowedMenuIdsAfter) {
        if (authGroupCd == null || authGroupCd.isBlank()) {
            return;
        }
        favoriteMapper.deleteForAuthGroupUsersNotInMenuIds(authGroupCd.trim(), allowedMenuIdsAfter);
    }

    @Transactional
    public void deleteAllForUsers(List<String> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return;
        }
        List<String> normalized = userIds.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .toList();
        if (normalized.isEmpty()) {
            return;
        }
        for (int from = 0; from < normalized.size(); from += BULK_DELETE_CHUNK_SIZE) {
            int to = Math.min(from + BULK_DELETE_CHUNK_SIZE, normalized.size());
            favoriteMapper.deleteAllForUserIds(normalized.subList(from, to));
        }
    }

    private static String requireMenuId(String menuId) {
        if (menuId == null || menuId.isBlank()) {
            throw new IllegalArgumentException(MessageKeys.ERROR_BAD_REQUEST);
        }
        return menuId.trim();
    }

    /**
     * @return null → 제한 없음(모든 즐겨찾기 표시). 빈 Set → 대시보드만 수준(교집합 없음).
     */
    private static Set<String> toAllowedSet(List<String> allowedMenuIds) {
        if (allowedMenuIds == null) {
            return null;
        }
        return allowedMenuIds.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private static String nullToEmpty(String s) {
        return s != null ? s : "";
    }

    private void recordFavoriteAddAudit(String uid, String mid, int nextSeq, MenuManageRow row, List<String> beforeMenuIds) {
        try {
            AuditLogCommand cmd = new AuditLogCommand();
            cmd.setDomainType("USER_MENU_FAVORITE");
            cmd.setSystemMainCd(row.getSystemMainCd());
            cmd.setSystemSubCd(row.getSystemSubCd());
            cmd.setMenuCode(mid);
            cmd.setMenuNameKo(row.getMenuNmKo());
            cmd.setActionCode("CREATE");
            cmd.setActionNameKo("등록");
            cmd.setEntityType("om_user_menu_favorite_r");
            cmd.setEntityId(uid + ":" + mid);
            cmd.setBeforeData(objectMapper.writeValueAsString(Map.of(
                    "userId", uid,
                    "menuIds", beforeMenuIds != null ? beforeMenuIds : List.of()
            )));
            cmd.setAfterData(objectMapper.writeValueAsString(Map.of(
                    "userId", uid,
                    "menuId", mid,
                    "dispSeq", nextSeq,
                    "menuNameKo", row.getMenuNmKo() != null ? row.getMenuNmKo() : ""
            )));
            cmd.setChangedFields("[]");
            cmd.setActorUserId(uid);
            auditService.record(cmd);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    private void recordFavoriteRemoveAudit(String uid, String mid) {
        MenuManageRow row = menuMMapper.selectOne(mid);
        String systemMainCd = row != null && row.getSystemMainCd() != null ? row.getSystemMainCd() : BO_MAIN;
        String systemSubCd = row != null && row.getSystemSubCd() != null ? row.getSystemSubCd() : BO_SUB;
        String menuNameKo = row != null && row.getMenuNmKo() != null ? row.getMenuNmKo() : mid;
        try {
            AuditLogCommand cmd = new AuditLogCommand();
            cmd.setDomainType("USER_MENU_FAVORITE");
            cmd.setSystemMainCd(systemMainCd);
            cmd.setSystemSubCd(systemSubCd);
            cmd.setMenuCode(mid);
            cmd.setMenuNameKo(menuNameKo);
            cmd.setActionCode("DELETE");
            cmd.setActionNameKo("삭제");
            cmd.setEntityType("om_user_menu_favorite_r");
            cmd.setEntityId(uid + ":" + mid);
            cmd.setBeforeData(objectMapper.writeValueAsString(Map.of(
                    "userId", uid,
                    "menuId", mid
            )));
            cmd.setAfterData(objectMapper.writeValueAsString(Map.of(
                    "userId", uid,
                    "menuId", mid,
                    "deleted", true
            )));
            cmd.setChangedFields("[]");
            cmd.setActorUserId(uid);
            auditService.record(cmd);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }
}
