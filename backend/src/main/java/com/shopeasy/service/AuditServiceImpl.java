package com.shopeasy.service;

import com.shopeasy.dto.AuditLogCommand;
import com.shopeasy.mapper.OmAuditLogHMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import org.springframework.stereotype.Service;

import java.util.Iterator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

@Service
public class AuditServiceImpl implements AuditService {

    private final OmAuditLogHMapper auditLogHMapper;
    private final ObjectMapper objectMapper;
    private static final Map<String, String> COMMON_FIELD_LABELS = new HashMap<>();
    private static final Map<String, Map<String, String>> MENU_FIELD_LABELS = new HashMap<>();

    static {
        COMMON_FIELD_LABELS.put("remark", "비고");
        COMMON_FIELD_LABELS.put("menuIds", "메뉴 목록");
        COMMON_FIELD_LABELS.put("menuNmKo", "메뉴명(한글)");
        COMMON_FIELD_LABELS.put("menuNmEn", "메뉴명(영문)");
        COMMON_FIELD_LABELS.put("menuNmJa", "메뉴명(일문)");
        COMMON_FIELD_LABELS.put("menuNmVi", "메뉴명(베트남어)");
        COMMON_FIELD_LABELS.put("menuUrl", "메뉴 URL");
        COMMON_FIELD_LABELS.put("isActive", "사용여부");
        COMMON_FIELD_LABELS.put("dispSeq", "표시순서");
        COMMON_FIELD_LABELS.put("icon", "아이콘");
        COMMON_FIELD_LABELS.put("menuType", "메뉴유형");
        COMMON_FIELD_LABELS.put("field", "변경항목");
        COMMON_FIELD_LABELS.put("value", "변경값");
        COMMON_FIELD_LABELS.put("deleted", "삭제여부");
        COMMON_FIELD_LABELS.put("deletedCount", "삭제건수");
        COMMON_FIELD_LABELS.put("affectedUsers", "영향 사용자 수");
        COMMON_FIELD_LABELS.put("systemSubCd", "시스템 구분");

        Map<String, String> auth = new HashMap<>();
        auth.put("authGroupNm", "권한그룹명");
        auth.put("remark", "비고");
        MENU_FIELD_LABELS.put("system-authorities", auth);

        Map<String, String> user = new HashMap<>();
        user.put("userNm", "사용자명");
        user.put("emailId", "이메일");
        user.put("gradeCd", "등급코드");
        user.put("authGroup", "권한그룹");
        user.put("userStatus", "사용자상태");
        user.put("mobileNo", "휴대전화");
        user.put("corporationCd", "법인코드");
        user.put("passwordChanged", "비밀번호 변경");
        user.put("field", "변경항목");
        user.put("value", "변경값");
        MENU_FIELD_LABELS.put("basic-users", user);

        Map<String, String> corp = new HashMap<>();
        corp.put("corporationNm", "화주명");
        corp.put("businessNo", "사업자등록번호");
        corp.put("telNo", "대표전화");
        corp.put("email", "대표이메일");
        corp.put("field", "변경항목");
        corp.put("value", "변경값");
        MENU_FIELD_LABELS.put("basic-shipper", corp);

        Map<String, String> code = new HashMap<>();
        code.put("codeNm.ko", "코드명(한글)");
        code.put("codeNm.en", "코드명(영문)");
        code.put("codeInfo.use_yn", "사용여부");
        code.put("codeInfo.disp_seq", "표시순서");
        code.put("codeInfo.etc1", "기타1");
        code.put("codeInfo.etc2", "기타2");
        code.put("codeNm", "코드명");
        code.put("codeInfo", "코드부가정보");
        MENU_FIELD_LABELS.put("system-common-code", code);

        Map<String, String> menu = new HashMap<>();
        menu.put("menuNmKo", "메뉴명(한글)");
        menu.put("menuNmEn", "메뉴명(영문)");
        menu.put("menuNmJa", "메뉴명(일문)");
        menu.put("menuNmVi", "메뉴명(베트남어)");
        menu.put("menuUrl", "메뉴 URL");
        menu.put("isActive", "사용여부");
        menu.put("dispSeq", "표시순서");
        menu.put("icon", "아이콘");
        menu.put("menuType", "메뉴유형");
        menu.put("deletedCount", "삭제건수");
        MENU_FIELD_LABELS.put("system-menus", menu);
    }

    public AuditServiceImpl(OmAuditLogHMapper auditLogHMapper, ObjectMapper objectMapper) {
        this.auditLogHMapper = auditLogHMapper;
        this.objectMapper = objectMapper;
    }

    @Override
    public void record(AuditLogCommand command) {
        if (command == null) {
            throw new IllegalArgumentException("audit command is required");
        }
        String actionCode = safe(command.getActionCode());
        String actionNameKo = resolveActionNameKo(actionCode);
        String beforeData = safeOrDefault(command.getBeforeData(), "{}");
        String afterData = safeOrDefault(command.getAfterData(), "{}");
        String changedFields = resolveChangedFieldsJson(
                command.getChangedFields(),
                beforeData,
                afterData,
                command.getMenuCode());
        int inserted = auditLogHMapper.insertAudit(
                safe(command.getDomainType()),
                safeOrDefault(command.getSystemMainCd(), "SYSTEM"),
                safe(command.getSystemSubCd()),
                safe(command.getMenuCode()),
                safe(command.getMenuNameKo()),
                actionCode,
                actionNameKo,
                safe(command.getEntityType()),
                safe(command.getEntityId()),
                beforeData,
                afterData,
                changedFields,
                safeOrDefault(command.getActorUserId(), "system"),
                trimToNull(command.getRequestId()),
                trimToNull(command.getRequestIp()),
                trimToNull(command.getUserAgent()),
                safeOrDefault(command.getActorUserId(), "system"));
        if (inserted != 1) {
            throw new IllegalStateException("audit insert failed");
        }
    }

    private String resolveActionNameKo(String actionCode) {
        return switch (actionCode) {
            case "CREATE" -> "등록";
            case "UPDATE" -> "수정";
            case "DELETE" -> "삭제";
            default -> throw new IllegalArgumentException("unsupported action code: " + actionCode);
        };
    }

    private String safe(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("audit required field is blank");
        }
        return value.trim();
    }

    private String safeOrDefault(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String resolveChangedFieldsJson(String changedFieldsRaw, String beforeData, String afterData, String menuCode) {
        String changed = changedFieldsRaw != null ? changedFieldsRaw.trim() : "";
        if (!changed.isEmpty() && !"[]".equals(changed)) {
            return changed;
        }
        try {
            JsonNode beforeNode = objectMapper.readTree(beforeData);
            JsonNode afterNode = objectMapper.readTree(afterData);
            if (beforeNode != null && beforeNode.isObject() && afterNode != null && afterNode.isObject()) {
                Set<String> keys = new LinkedHashSet<>();
                collectObjectDiffKeys("", beforeNode, afterNode, keys);
                // field/value 형태(grid 단건 수정)인 경우 실제 필드 라벨로 치환
                String pointedField = resolvePointedField(afterNode);
                if (pointedField != null && !pointedField.isBlank()) {
                    keys.remove("field");
                    keys.remove("value");
                    keys.add(pointedField);
                }
                ArrayNode arr = objectMapper.createArrayNode();
                for (String key : keys) {
                    arr.add(resolveLabel(menuCode, key));
                }
                return objectMapper.writeValueAsString(arr);
            }
            if ((beforeNode == null && afterNode != null) || (beforeNode != null && !beforeNode.equals(afterNode))) {
                return "[\"$\"]";
            }
            return "[]";
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("failed to resolve changed fields", e);
        }
    }

    private void collectObjectDiffKeys(String prefix, JsonNode beforeNode, JsonNode afterNode, Set<String> out) {
        Set<String> allKeys = new LinkedHashSet<>();
        Iterator<String> beforeIt = beforeNode.fieldNames();
        while (beforeIt.hasNext()) {
            allKeys.add(beforeIt.next());
        }
        Iterator<String> afterIt = afterNode.fieldNames();
        while (afterIt.hasNext()) {
            allKeys.add(afterIt.next());
        }
        for (String key : allKeys) {
            JsonNode b = beforeNode.get(key);
            JsonNode a = afterNode.get(key);
            String path = prefix.isEmpty() ? key : prefix + "." + key;
            if (b == null || a == null) {
                out.add(path);
                continue;
            }
            if (b.isObject() && a.isObject()) {
                collectObjectDiffKeys(path, b, a, out);
                continue;
            }
            if (!b.equals(a)) {
                out.add(path);
            }
        }
    }

    private String resolveLabel(String menuCode, String key) {
        if (menuCode != null) {
            Map<String, String> menuMap = MENU_FIELD_LABELS.get(menuCode);
            if (menuMap != null && menuMap.containsKey(key)) {
                return menuMap.get(key);
            }
        }
        if (COMMON_FIELD_LABELS.containsKey(key)) {
            return COMMON_FIELD_LABELS.get(key);
        }
        return key;
    }

    private String resolvePointedField(JsonNode afterNode) {
        if (afterNode == null || !afterNode.isObject()) {
            return null;
        }
        JsonNode n = afterNode.get("field");
        if (n == null || n.isNull()) {
            return null;
        }
        String field = n.asText("");
        return field.isBlank() ? null : field;
    }
}
