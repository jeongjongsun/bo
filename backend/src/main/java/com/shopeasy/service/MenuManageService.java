package com.shopeasy.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.shopeasy.api.MessageKeys;
import com.shopeasy.dto.MenuCreateRequest;
import com.shopeasy.dto.MenuCreateResult;
import com.shopeasy.dto.MenuManageRow;
import com.shopeasy.dto.MenuUpdateRequest;
import com.shopeasy.dto.AuditLogCommand;
import com.shopeasy.mapper.OmMenuMMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * 메뉴(OM_MENU_M) 관리: 시스템별 트리 조회, 상세, 등록(자동 채번), 수정.
 */
@Service
public class MenuManageService {

    private static final String DEFAULT_SYSTEM_MAIN = "SYSTEM";
    private static final String ID_PREFIX_BO = "MNU_B_";
    private static final String ID_PREFIX_OM = "MNU_O_";
    private static final int ID_NUM_WIDTH = 8;

    private final OmMenuMMapper omMenuMMapper;
    private final ObjectMapper objectMapper;
    private final AuditService auditService;

    public MenuManageService(OmMenuMMapper omMenuMMapper, ObjectMapper objectMapper, AuditService auditService) {
        this.omMenuMMapper = omMenuMMapper;
        this.objectMapper = objectMapper;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<MenuManageRow> listFlat(String systemMainCd, String systemSubCd) {
        String main = normalizeSystemMain(systemMainCd);
        String sub = requireSystemSub(systemSubCd);
        requireOmOrBo(sub);
        return omMenuMMapper.selectFlatBySystem(main, sub);
    }

    @Transactional(readOnly = true)
    public MenuManageRow getDetail(String menuId) {
        if (menuId == null || menuId.isBlank()) {
            throw new IllegalArgumentException(MessageKeys.MENUS_NOT_FOUND);
        }
        MenuManageRow row = omMenuMMapper.selectOne(menuId.trim());
        if (row == null) {
            throw new IllegalArgumentException(MessageKeys.MENUS_NOT_FOUND);
        }
        return row;
    }

    @Transactional
    public MenuCreateResult create(MenuCreateRequest request, String userId) {
        if (request == null) {
            throw new IllegalArgumentException(MessageKeys.ERROR_BAD_REQUEST);
        }
        String systemMain = normalizeSystemMain(request.getSystemMainCd());
        String systemSub = requireSystemSub(request.getSystemSubCd());
        requireOmOrBo(systemSub);
        requireMenuNmKo(request.getMenuNmKo());

        String parentId = trimToNull(request.getParentMenuId());
        if (parentId != null) {
            MenuManageRow parent = omMenuMMapper.selectOne(parentId);
            if (parent == null) {
                throw new IllegalArgumentException(MessageKeys.MENUS_PARENT_NOT_FOUND);
            }
            if (!systemMain.equals(parent.getSystemMainCd()) || !systemSub.equals(parent.getSystemSubCd())) {
                throw new IllegalArgumentException(MessageKeys.MENUS_PARENT_SYSTEM_MISMATCH);
            }
        }

        String newId = allocateMenuId(systemSub);
        String menuNmJson = buildMenuNmJson(
                request.getMenuNmKo(),
                request.getMenuNmEn(),
                request.getMenuNmJa(),
                request.getMenuNmVi());
        String menuType = resolveMenuType(request.getMenuType(), request.getMenuUrl());
        String menuInfoJson = buildMenuInfoJson(menuType, null);

        int disp = request.getDispSeq() != null ? request.getDispSeq() : 0;
        boolean active = request.getIsActive() == null || Boolean.TRUE.equals(request.getIsActive());
        String icon = trimToNull(request.getIcon());
        String menuUrl = trimToNull(request.getMenuUrl());

        String uid = userId != null && !userId.isBlank() ? userId : "system";
        int n = omMenuMMapper.insert(
                newId,
                systemMain,
                systemSub,
                parentId,
                menuNmJson,
                menuUrl,
                active,
                icon,
                disp,
                menuInfoJson,
                uid);
        if (n != 1) {
            throw new IllegalStateException("menu insert failed");
        }
        recordAudit(
                "CREATE",
                newId,
                systemMain,
                systemSub,
                uid,
                Map.of(),
                buildMenuAuditState(
                        newId,
                        parentId,
                        systemMain,
                        systemSub,
                        request.getMenuNmKo().trim(),
                        menuUrl,
                        active,
                        disp,
                        icon,
                        menuType));
        return new MenuCreateResult(newId);
    }

    @Transactional
    public void update(String menuId, MenuUpdateRequest request, String userId) {
        if (menuId == null || menuId.isBlank() || request == null) {
            throw new IllegalArgumentException(MessageKeys.ERROR_BAD_REQUEST);
        }
        MenuManageRow existing = omMenuMMapper.selectOne(menuId.trim());
        if (existing == null) {
            throw new IllegalArgumentException(MessageKeys.MENUS_NOT_FOUND);
        }
        requireMenuNmKo(request.getMenuNmKo());

        String menuNmJson = buildMenuNmJson(
                request.getMenuNmKo(),
                request.getMenuNmEn(),
                request.getMenuNmJa(),
                request.getMenuNmVi());
        String menuType = resolveMenuType(request.getMenuType(), request.getMenuUrl());
        String menuInfoJson = mergeMenuInfoForUpdate(existing, menuType);

        int disp = request.getDispSeq() != null ? request.getDispSeq() : 0;
        boolean active = request.getIsActive() == null || Boolean.TRUE.equals(request.getIsActive());
        String icon = trimToNull(request.getIcon());
        String menuUrl = trimToNull(request.getMenuUrl());

        String uid = userId != null && !userId.isBlank() ? userId : "system";
        int n = omMenuMMapper.update(menuId.trim(), menuNmJson, menuUrl, active, icon, disp, menuInfoJson, uid);
        if (n != 1) {
            throw new IllegalArgumentException(MessageKeys.MENUS_NOT_FOUND);
        }
        recordAudit(
                "UPDATE",
                menuId.trim(),
                existing.getSystemMainCd(),
                existing.getSystemSubCd(),
                uid,
                buildMenuAuditState(existing),
                buildMenuAuditState(
                        menuId.trim(),
                        existing.getParentMenuId(),
                        existing.getSystemMainCd(),
                        existing.getSystemSubCd(),
                        request.getMenuNmKo().trim(),
                        menuUrl,
                        active,
                        disp,
                        icon,
                        menuType));
    }

    @Transactional
    public void deleteCascade(String menuId, String userId) {
        if (menuId == null || menuId.isBlank()) {
            throw new IllegalArgumentException(MessageKeys.ERROR_BAD_REQUEST);
        }
        MenuManageRow existing = omMenuMMapper.selectOne(menuId.trim());
        if (existing == null) {
            throw new IllegalArgumentException(MessageKeys.MENUS_NOT_FOUND);
        }
        String uid = userId != null && !userId.isBlank() ? userId : "system";
        int affected = omMenuMMapper.softDeleteCascade(menuId.trim(), uid);
        if (affected < 1) {
            throw new IllegalArgumentException(MessageKeys.MENUS_NOT_FOUND);
        }
        Map<String, Object> beforeState = buildMenuAuditState(existing);
        Map<String, Object> afterState = new LinkedHashMap<>(beforeState);
        afterState.put("deletedYn", true);
        afterState.put("deletedCount", affected);
        recordAudit("DELETE", menuId.trim(), existing.getSystemMainCd(), existing.getSystemSubCd(), uid, beforeState, afterState);
    }

    private String normalizeSystemMain(String systemMainCd) {
        if (systemMainCd == null || systemMainCd.isBlank()) {
            return DEFAULT_SYSTEM_MAIN;
        }
        return systemMainCd.trim();
    }

    private String requireSystemSub(String systemSubCd) {
        if (systemSubCd == null || systemSubCd.isBlank()) {
            throw new IllegalArgumentException(MessageKeys.MENUS_SYSTEM_SUB_CD_REQUIRED);
        }
        return systemSubCd.trim();
    }

    private void requireOmOrBo(String systemSubCd) {
        if (!"OM".equalsIgnoreCase(systemSubCd) && !"BO".equalsIgnoreCase(systemSubCd)) {
            throw new IllegalArgumentException(MessageKeys.MENUS_SYSTEM_SUB_CD_REQUIRED);
        }
    }

    private void requireMenuNmKo(String menuNmKo) {
        if (menuNmKo == null || menuNmKo.isBlank()) {
            throw new IllegalArgumentException(MessageKeys.MENUS_MENU_NM_KO_REQUIRED);
        }
    }

    private String trimToNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private String resolveMenuType(String menuType, String menuUrl) {
        if (menuType != null && !menuType.isBlank()) {
            return menuType.trim();
        }
        String url = trimToNull(menuUrl);
        return url == null ? "GROUP" : "PAGE";
    }

    private String allocateMenuId(String systemSubCd) {
        String prefix;
        if ("BO".equalsIgnoreCase(systemSubCd)) {
            prefix = ID_PREFIX_BO;
        } else if ("OM".equalsIgnoreCase(systemSubCd)) {
            prefix = ID_PREFIX_OM;
        } else {
            throw new IllegalArgumentException(MessageKeys.MENUS_SYSTEM_SUB_CD_REQUIRED);
        }
        Integer max = omMenuMMapper.selectMaxNumericSuffix(systemSubCd, prefix);
        int next = (max == null ? 0 : max) + 1;
        String suffix = String.format("%0" + ID_NUM_WIDTH + "d", next);
        return prefix + suffix;
    }

    private String buildMenuNmJson(String ko, String en, String ja, String vi) {
        try {
            ObjectNode n = objectMapper.createObjectNode();
            n.put("ko", ko.trim());
            if (en != null && !en.isBlank()) {
                n.put("en", en.trim());
            }
            if (ja != null && !ja.isBlank()) {
                n.put("ja", ja.trim());
            }
            if (vi != null && !vi.isBlank()) {
                n.put("vi", vi.trim());
            }
            return objectMapper.writeValueAsString(n);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    private String buildMenuInfoJson(String menuType, JsonNode existing) {
        try {
            ObjectNode root = objectMapper.createObjectNode();
            if (existing != null && existing.isObject()) {
                root.setAll((ObjectNode) existing);
            }
            root.put("menu_type", menuType);
            return objectMapper.writeValueAsString(root);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    private String mergeMenuInfoForUpdate(MenuManageRow existing, String menuType) {
        try {
            String raw = existing.getMenuInfoRaw() != null ? existing.getMenuInfoRaw() : "{}";
            JsonNode node = objectMapper.readTree(raw);
            return buildMenuInfoJson(menuType, node);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    private Map<String, Object> buildMenuAuditState(MenuManageRow row) {
        return buildMenuAuditState(
                row.getMenuId(),
                row.getParentMenuId(),
                row.getSystemMainCd(),
                row.getSystemSubCd(),
                row.getMenuNmKo(),
                row.getMenuUrl(),
                row.getIsActive() != null && row.getIsActive(),
                row.getDispSeq() != null ? row.getDispSeq() : 0,
                row.getIcon(),
                row.getMenuType());
    }

    private Map<String, Object> buildMenuAuditState(
            String menuId,
            String parentMenuId,
            String systemMainCd,
            String systemSubCd,
            String menuNmKo,
            String menuUrl,
            boolean isActive,
            int dispSeq,
            String icon,
            String menuType) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("menuId", menuId != null ? menuId : "");
        out.put("parentMenuId", parentMenuId != null ? parentMenuId : "");
        out.put("systemMainCd", systemMainCd != null ? systemMainCd : "");
        out.put("systemSubCd", systemSubCd != null ? systemSubCd : "");
        out.put("menuNmKo", menuNmKo != null ? menuNmKo : "");
        out.put("menuUrl", menuUrl != null ? menuUrl : "");
        out.put("isActive", isActive);
        out.put("dispSeq", dispSeq);
        out.put("icon", icon != null ? icon : "");
        out.put("menuType", menuType != null ? menuType : "");
        return out;
    }

    private void recordAudit(
            String actionCode,
            String entityId,
            String systemMainCd,
            String systemSubCd,
            String actorUserId,
            Map<String, Object> before,
            Map<String, Object> after) {
        try {
            AuditLogCommand cmd = new AuditLogCommand();
            cmd.setDomainType("MENU");
            cmd.setSystemMainCd(systemMainCd);
            cmd.setSystemSubCd(systemSubCd != null ? systemSubCd.toUpperCase() : "BO");
            cmd.setMenuCode("system-menus");
            cmd.setMenuNameKo("메뉴 관리");
            cmd.setActionCode(actionCode);
            cmd.setEntityType("om_menu_m");
            cmd.setEntityId(entityId);
            cmd.setBeforeData(objectMapper.writeValueAsString(before != null ? before : Map.of()));
            cmd.setAfterData(objectMapper.writeValueAsString(after != null ? after : Map.of()));
            cmd.setChangedFields(computeChangedFields(before, after));
            cmd.setActorUserId(actorUserId != null && !actorUserId.isBlank() ? actorUserId : "system");
            auditService.record(cmd);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    private String computeChangedFields(Map<String, Object> before, Map<String, Object> after) throws JsonProcessingException {
        Map<String, Object> beforeMap = before != null ? before : Map.of();
        Map<String, Object> afterMap = after != null ? after : Map.of();
        Set<String> keys = new LinkedHashSet<>();
        keys.addAll(beforeMap.keySet());
        keys.addAll(afterMap.keySet());

        List<String> changed = new ArrayList<>();
        for (String key : keys) {
            Object beforeValue = beforeMap.get(key);
            Object afterValue = afterMap.get(key);
            if (isComplexValue(beforeValue) || isComplexValue(afterValue)) {
                String beforeJson = objectMapper.writeValueAsString(beforeValue);
                String afterJson = objectMapper.writeValueAsString(afterValue);
                if (!Objects.equals(beforeJson, afterJson)) {
                    changed.add(key);
                }
            } else if (!Objects.equals(beforeValue, afterValue)) {
                changed.add(key);
            }
        }
        return objectMapper.writeValueAsString(changed);
    }

    private boolean isComplexValue(Object value) {
        return value instanceof Map<?, ?> || value instanceof List<?> || value instanceof JsonNode || (value != null && value.getClass().isArray());
    }
}
