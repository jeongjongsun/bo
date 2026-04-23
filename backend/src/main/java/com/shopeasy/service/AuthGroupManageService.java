package com.shopeasy.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopeasy.api.MessageKeys;
import com.shopeasy.api.PagedData;
import com.shopeasy.dto.AuthGroupCreateRequest;
import com.shopeasy.dto.AuthGroupManageRow;
import com.shopeasy.dto.AuthGroupMenuAuditRow;
import com.shopeasy.dto.AuthGroupMenuConfigResponse;
import com.shopeasy.dto.AuthGroupMenuSaveRequest;
import com.shopeasy.dto.AuthGroupUpdateRequest;
import com.shopeasy.dto.AuditLogCommand;
import com.shopeasy.dto.MenuManageRow;
import com.shopeasy.mapper.OmAuthGroupMMapper;
import com.shopeasy.mapper.OmAuthGroupManageMapper;
import com.shopeasy.mapper.OmAuthGroupMenuAuditHMapper;
import com.shopeasy.mapper.OmAuthGroupMenuRMapper;
import com.shopeasy.mapper.OmMenuMMapper;
import com.shopeasy.mapper.OmUserMMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
/** 권한관리(권한그룹-메뉴 매핑 + 감사 로그) 서비스. */
@Service
public class AuthGroupManageService {

    private static final String DEFAULT_SYSTEM_MAIN = "SYSTEM";
    private static final String ACTION_UPSERT = "UPSERT";
    private static final String ACTION_DELETE_GROUP = "DELETE_GROUP";
    private static final String ACTION_CLEAR_USERS_AUTH_GROUP = "CLEAR_USERS_AUTH_GROUP";

    private final OmAuthGroupMMapper authGroupMMapper;
    private final OmAuthGroupManageMapper authGroupManageMapper;
    private final OmAuthGroupMenuRMapper authGroupMenuRMapper;
    private final OmAuthGroupMenuAuditHMapper authGroupMenuAuditHMapper;
    private final OmMenuMMapper menuMMapper;
    private final OmUserMMapper userMMapper;
    private final ObjectMapper objectMapper;
    private final UserMenuFavoriteService userMenuFavoriteService;
    private final AuditService auditService;

    public AuthGroupManageService(
            OmAuthGroupMMapper authGroupMMapper,
            OmAuthGroupManageMapper authGroupManageMapper,
            OmAuthGroupMenuRMapper authGroupMenuRMapper,
            OmAuthGroupMenuAuditHMapper authGroupMenuAuditHMapper,
            OmMenuMMapper menuMMapper,
            OmUserMMapper userMMapper,
            ObjectMapper objectMapper,
            UserMenuFavoriteService userMenuFavoriteService,
            AuditService auditService) {
        this.authGroupMMapper = authGroupMMapper;
        this.authGroupManageMapper = authGroupManageMapper;
        this.authGroupMenuRMapper = authGroupMenuRMapper;
        this.authGroupMenuAuditHMapper = authGroupMenuAuditHMapper;
        this.menuMMapper = menuMMapper;
        this.userMMapper = userMMapper;
        this.objectMapper = objectMapper;
        this.userMenuFavoriteService = userMenuFavoriteService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<AuthGroupManageRow> listGroups() {
        return authGroupManageMapper.selectManageList();
    }

    /**
     * 신규 권한그룹 코드: {@code AUTH-} + 4자리 일련번호. 기존 코드(삭제 포함)와 충돌하지 않을 때까지 증가.
     */
    private String allocateNextAuthGroupCd() {
        int maxSerial = authGroupManageMapper.selectMaxAuthPrefixedSerial();
        for (int n = maxSerial + 1; n <= 9999; n++) {
            String candidate = String.format("AUTH-%04d", n);
            if (authGroupMMapper.countByCdAll(candidate) == 0) {
                return candidate;
            }
        }
        throw new IllegalArgumentException(MessageKeys.ERROR_BAD_REQUEST);
    }

    @Transactional
    public void createGroup(AuthGroupCreateRequest request, String actor, HttpServletRequest httpRequest) {
        if (request == null) {
            throw new IllegalArgumentException(MessageKeys.ERROR_BAD_REQUEST);
        }
        String groupNm = trimToNull(request.getAuthGroupNm());
        if (groupNm == null) {
            throw new IllegalArgumentException(MessageKeys.AUTH_GROUPS_NAME_REQUIRED);
        }
        String groupCd = allocateNextAuthGroupCd();
        String userId = normalizeActor(actor);
        int nextSort = authGroupManageMapper.selectMaxSortSeq() + 1;
        int inserted = authGroupManageMapper.insert(
                groupCd,
                groupNm,
                trimToNull(request.getRemark()),
                nextSort,
                userId);
        if (inserted != 1) {
            throw new IllegalArgumentException(MessageKeys.ERROR_BAD_REQUEST);
        }
        recordCommonAudit(
                "CREATE",
                groupCd,
                userId,
                Map.of(),
                Map.of("authGroupNm", groupNm, "remark", trimToNull(request.getRemark())),
                trimToNull(httpRequest != null ? httpRequest.getHeader("X-Request-Id") : null),
                trimToNull(httpRequest != null ? httpRequest.getRemoteAddr() : null),
                trimToNull(httpRequest != null ? httpRequest.getHeader("User-Agent") : null));
    }

    @Transactional
    public void updateGroupInfo(String authGroupCd, AuthGroupUpdateRequest request, String actor) {
        if (request == null) {
            throw new IllegalArgumentException(MessageKeys.ERROR_BAD_REQUEST);
        }
        String groupCd = requireGroupCd(authGroupCd);
        requireExistingGroup(groupCd);
        AuthGroupManageRow beforeRow = authGroupManageMapper.selectManageOne(groupCd);
        String groupNm = trimToNull(request.getAuthGroupNm());
        if (groupNm == null) {
            throw new IllegalArgumentException(MessageKeys.AUTH_GROUPS_NAME_REQUIRED);
        }
        int updated = authGroupManageMapper.updateGroupInfo(
                groupCd,
                groupNm,
                trimToNull(request.getRemark()),
                normalizeActor(actor));
        if (updated != 1) {
            throw new IllegalArgumentException(MessageKeys.AUTH_GROUPS_NOT_FOUND);
        }
        recordCommonAudit("UPDATE", groupCd, normalizeActor(actor), Map.of(
                "authGroupNm", beforeRow != null && beforeRow.getAuthGroupNm() != null ? beforeRow.getAuthGroupNm() : "",
                "remark", beforeRow != null && beforeRow.getRemark() != null ? beforeRow.getRemark() : ""), Map.of(
                "authGroupNm", groupNm,
                "remark", trimToNull(request.getRemark()) != null ? trimToNull(request.getRemark()) : ""));
    }

    @Transactional(readOnly = true)
    public AuthGroupMenuConfigResponse getGroupMenus(String authGroupCd, String systemMainCd, String systemSubCd) {
        String groupCd = requireGroupCd(authGroupCd);
        requireExistingGroup(groupCd);
        String mainCd = normalizeSystemMain(systemMainCd);
        String subCd = requireSystemSub(systemSubCd);
        List<MenuManageRow> menus = menuMMapper.selectFlatBySystem(mainCd, subCd);
        List<String> selectedMenuIds = authGroupMenuRMapper.selectMenuIdsByGroupAndSystem(groupCd, mainCd, subCd);

        AuthGroupMenuConfigResponse response = new AuthGroupMenuConfigResponse();
        response.setAuthGroupCd(groupCd);
        response.setSystemMainCd(mainCd);
        response.setSystemSubCd(subCd);
        response.setMenus(menus);
        response.setSelectedMenuIds(selectedMenuIds);
        return response;
    }

    @Transactional
    public void saveGroupMenus(
            String authGroupCd, AuthGroupMenuSaveRequest request, String actor, HttpServletRequest httpRequest) {
        if (request == null) {
            throw new IllegalArgumentException(MessageKeys.ERROR_BAD_REQUEST);
        }
        String groupCd = requireGroupCd(authGroupCd);
        requireExistingGroup(groupCd);
        String mainCd = normalizeSystemMain(request.getSystemMainCd());
        String subCd = requireSystemSub(request.getSystemSubCd());

        List<String> before = authGroupMenuRMapper.selectMenuIdsByGroupAndSystem(groupCd, mainCd, subCd);
        List<String> normalizedMenuIds = normalizeMenuIds(request.getMenuIds());
        validateMenuIds(mainCd, subCd, normalizedMenuIds);

        String userId = normalizeActor(actor);
        authGroupMenuRMapper.softDeleteByGroupAndSystem(groupCd, mainCd, subCd, userId);
        if (!normalizedMenuIds.isEmpty()) {
            authGroupMenuRMapper.insertBatch(groupCd, mainCd, subCd, normalizedMenuIds, userId);
        }

        List<String> after = authGroupMenuRMapper.selectMenuIdsByGroupAndSystem(groupCd, mainCd, subCd);
        int affectedUsers = userMMapper.countByAuthGroup(groupCd);
        authGroupMenuAuditHMapper.insertAudit(
                groupCd,
                ACTION_UPSERT,
                mainCd,
                subCd,
                toJsonArray(before),
                toJsonArray(after),
                affectedUsers,
                trimToNull(request.getChangeReason()),
                trimToNull(httpRequest != null ? httpRequest.getHeader("X-Request-Id") : null),
                trimToNull(httpRequest != null ? httpRequest.getRemoteAddr() : null),
                trimToNull(httpRequest != null ? httpRequest.getHeader("User-Agent") : null),
                userId);
        recordCommonAudit("UPDATE", groupCd, userId, Map.of(
                "systemSubCd", subCd,
                "menuIds", before), Map.of(
                "systemSubCd", subCd,
                "menuIds", after));

        if ("BO".equals(subCd)) {
            userMenuFavoriteService.cleanupAfterAuthGroupMenuSave(groupCd, after);
        }
    }

    @Transactional
    public void deleteGroup(String authGroupCd, String actor, HttpServletRequest httpRequest) {
        String groupCd = requireGroupCd(authGroupCd);
        requireExistingGroup(groupCd);
        String userId = normalizeActor(actor);
        int affectedUsers = userMMapper.countByAuthGroup(groupCd);
        List<String> usersInGroup = userMMapper.selectUserIdsByAuthGroup(groupCd);

        authGroupMenuRMapper.softDeleteByGroup(groupCd, userId);
        int clearedUsers = userMMapper.clearAuthGroupByAuthGroup(groupCd, userId);
        int deleted = authGroupManageMapper.softDelete(groupCd, userId);
        if (deleted != 1) {
            throw new IllegalArgumentException(MessageKeys.AUTH_GROUPS_NOT_FOUND);
        }

        String requestId = trimToNull(httpRequest != null ? httpRequest.getHeader("X-Request-Id") : null);
        String requestIp = trimToNull(httpRequest != null ? httpRequest.getRemoteAddr() : null);
        String userAgent = trimToNull(httpRequest != null ? httpRequest.getHeader("User-Agent") : null);

        authGroupMenuAuditHMapper.insertAudit(
                groupCd,
                ACTION_CLEAR_USERS_AUTH_GROUP,
                DEFAULT_SYSTEM_MAIN,
                "BO",
                "[]",
                "[]",
                clearedUsers,
                "auth_group reset by group delete",
                requestId,
                requestIp,
                userAgent,
                userId);
        recordCommonAudit("DELETE", groupCd, userId, Map.of("affectedUsers", affectedUsers), Map.of("deleted", true));

        authGroupMenuAuditHMapper.insertAudit(
                groupCd,
                ACTION_DELETE_GROUP,
                DEFAULT_SYSTEM_MAIN,
                "BO",
                "[]",
                "[]",
                affectedUsers,
                "auth group deleted",
                requestId,
                requestIp,
                userAgent,
                userId);

        if (usersInGroup != null && !usersInGroup.isEmpty()) {
            userMenuFavoriteService.deleteAllForUsers(usersInGroup);
        }
    }

    @Transactional(readOnly = true)
    public PagedData<AuthGroupMenuAuditRow> getAudits(String authGroupCd, int page, int size) {
        String groupCd = requireGroupCd(authGroupCd);
        requireExistingGroup(groupCd);
        int safeSize = size > 0 ? size : 20;
        int safePage = Math.max(page, 0);
        int offset = safePage * safeSize;
        long total = authGroupMenuAuditHMapper.selectAuditCount(groupCd);
        List<AuthGroupMenuAuditRow> items = authGroupMenuAuditHMapper.selectAuditList(groupCd, safeSize, offset);
        int totalPages = safeSize > 0 ? (int) Math.ceil((double) total / safeSize) : 0;
        return new PagedData<>(items, safePage, safeSize, total, totalPages,
                safePage == 0, safePage >= Math.max(0, totalPages - 1), null);
    }

    private String requireGroupCd(String authGroupCd) {
        if (authGroupCd == null || authGroupCd.isBlank()) {
            throw new IllegalArgumentException(MessageKeys.AUTH_GROUPS_CODE_REQUIRED);
        }
        return authGroupCd.trim();
    }

    private void requireExistingGroup(String authGroupCd) {
        if (authGroupMMapper.countByCd(authGroupCd) < 1) {
            throw new IllegalArgumentException(MessageKeys.AUTH_GROUPS_NOT_FOUND);
        }
    }

    private String normalizeSystemMain(String systemMainCd) {
        if (systemMainCd == null || systemMainCd.isBlank()) {
            return DEFAULT_SYSTEM_MAIN;
        }
        return systemMainCd.trim();
    }

    private String requireSystemSub(String systemSubCd) {
        if (systemSubCd == null || systemSubCd.isBlank()) {
            throw new IllegalArgumentException(MessageKeys.AUTH_GROUPS_SYSTEM_SUB_CD_REQUIRED);
        }
        String sub = systemSubCd.trim().toUpperCase();
        if (!"OM".equals(sub) && !"BO".equals(sub)) {
            throw new IllegalArgumentException(MessageKeys.AUTH_GROUPS_SYSTEM_SUB_CD_REQUIRED);
        }
        return sub;
    }

    private List<String> normalizeMenuIds(List<String> menuIds) {
        if (menuIds == null || menuIds.isEmpty()) {
            return List.of();
        }
        Set<String> unique = new LinkedHashSet<>();
        for (String menuId : menuIds) {
            if (menuId == null || menuId.isBlank()) {
                continue;
            }
            unique.add(menuId.trim());
        }
        return new ArrayList<>(unique);
    }

    private void validateMenuIds(String systemMainCd, String systemSubCd, List<String> menuIds) {
        if (menuIds.isEmpty()) {
            return;
        }
        int validCount = menuMMapper.countActiveBySystemAndIds(systemMainCd, systemSubCd, menuIds);
        if (validCount != menuIds.size()) {
            throw new IllegalArgumentException(MessageKeys.AUTH_GROUPS_INVALID_MENU_IDS);
        }
    }

    private String toJsonArray(List<String> value) {
        try {
            return objectMapper.writeValueAsString(value != null ? value : List.of());
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    private String normalizeActor(String actor) {
        if (actor == null || actor.isBlank()) {
            return "system";
        }
        return actor.trim();
    }

    private String trimToNull(String text) {
        if (text == null) {
            return null;
        }
        String trimmed = text.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void recordCommonAudit(
            String actionCode,
            String entityId,
            String actorUserId,
            Map<String, Object> before,
            Map<String, Object> after) {
        recordCommonAudit(actionCode, entityId, actorUserId, before, after, null, null, null);
    }

    private void recordCommonAudit(
            String actionCode,
            String entityId,
            String actorUserId,
            Map<String, Object> before,
            Map<String, Object> after,
            String requestId,
            String requestIp,
            String userAgent) {
        try {
            AuditLogCommand cmd = new AuditLogCommand();
            cmd.setDomainType("AUTH_GROUP");
            cmd.setSystemMainCd(DEFAULT_SYSTEM_MAIN);
            cmd.setSystemSubCd("BO");
            cmd.setMenuCode("system-authorities");
            cmd.setMenuNameKo("권한관리");
            cmd.setActionCode(actionCode);
            cmd.setEntityType("om_auth_group_m");
            cmd.setEntityId(entityId);
            cmd.setBeforeData(objectMapper.writeValueAsString(before != null ? before : Map.of()));
            cmd.setAfterData(objectMapper.writeValueAsString(after != null ? after : Map.of()));
            cmd.setChangedFields("[]");
            cmd.setActorUserId(actorUserId != null && !actorUserId.isBlank() ? actorUserId : "system");
            cmd.setRequestId(requestId);
            cmd.setRequestIp(requestIp);
            cmd.setUserAgent(userAgent);
            auditService.record(cmd);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }
}
