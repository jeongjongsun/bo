package com.shopeasy.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopeasy.dto.BoSidebarMenuDto;
import com.shopeasy.dto.MenuManageRow;
import com.shopeasy.mapper.OmMenuMMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * BO 사이드바: OM_MENU_M 플랫 목록을 권한(허용 menu_id)에 맞게 필터링해 반환.
 */
@Service
public class BoSidebarMenuService {
    private static final Logger log = LoggerFactory.getLogger(BoSidebarMenuService.class);

    public static final String BO_SYSTEM_MAIN = "SYSTEM";
    public static final String BO_SYSTEM_SUB = "BO";
    public static final String HOME_MENU_ID = "home";

    private final OmMenuMMapper menuMMapper;
    private final ObjectMapper objectMapper;

    public BoSidebarMenuService(OmMenuMMapper menuMMapper, ObjectMapper objectMapper) {
        this.menuMMapper = menuMMapper;
        this.objectMapper = objectMapper;
    }

    /**
     * @param allowedMenuIds null 이면 제한 없음(전체 BO 메뉴, home 제외). 빈 리스트면 빈 결과.
     */
    @Transactional(readOnly = true)
    public List<BoSidebarMenuDto> buildVisibleMenus(List<String> allowedMenuIds) {
        List<MenuManageRow> flat = menuMMapper.selectFlatBySystem(BO_SYSTEM_MAIN, BO_SYSTEM_SUB);
        if (flat == null || flat.isEmpty()) {
            return List.of();
        }
        Map<String, MenuManageRow> byId = flat.stream()
                .collect(Collectors.toMap(MenuManageRow::getMenuId, r -> r, (a, b) -> a, LinkedHashMap::new));

        Set<String> allowedSet = new HashSet<>();
        if (allowedMenuIds == null) {
            allowedSet.addAll(byId.keySet());
        } else {
            for (String id : allowedMenuIds) {
                if (id != null && !id.isBlank()) {
                    allowedSet.add(id.trim());
                }
            }
        }

        Set<String> visible = new HashSet<>();
        for (String id : allowedSet) {
            if (id == null || id.isBlank()) {
                continue;
            }
            String cur = id.trim();
            while (cur != null) {
                MenuManageRow row = byId.get(cur);
                if (row == null) {
                    break;
                }
                visible.add(cur);
                cur = row.getParentMenuId();
            }
        }

        Map<String, List<String>> childrenByParent = new HashMap<>();
        for (MenuManageRow r : flat) {
            String pid = r.getParentMenuId();
            if (pid == null) {
                continue;
            }
            childrenByParent.computeIfAbsent(pid, k -> new ArrayList<>()).add(r.getMenuId());
        }

        boolean changed = true;
        while (changed) {
            changed = false;
            List<String> groupIds = visible.stream()
                    .map(byId::get)
                    .filter(r -> r != null && "GROUP".equalsIgnoreCase(nullSafe(r.getMenuType())))
                    .map(MenuManageRow::getMenuId)
                    .collect(Collectors.toList());
            for (String gid : groupIds) {
                if (!hasVisiblePageDescendant(gid, byId, childrenByParent, visible)) {
                    if (visible.remove(gid)) {
                        changed = true;
                    }
                }
            }
        }

        visible.remove(HOME_MENU_ID);

        List<BoSidebarMenuDto> out = new ArrayList<>();
        for (MenuManageRow r : flat) {
            if (HOME_MENU_ID.equals(r.getMenuId())) {
                continue;
            }
            if (Boolean.FALSE.equals(r.getIsActive())) {
                continue;
            }
            if (!visible.contains(r.getMenuId())) {
                continue;
            }
            out.add(toDto(r));
        }
        return out;
    }

    private static String nullSafe(String s) {
        return s != null ? s : "";
    }

    private boolean hasVisiblePageDescendant(
            String rootId,
            Map<String, MenuManageRow> byId,
            Map<String, List<String>> childrenByParent,
            Set<String> visible) {
        Deque<String> dq = new ArrayDeque<>();
        for (String c : childrenByParent.getOrDefault(rootId, Collections.emptyList())) {
            dq.add(c);
        }
        while (!dq.isEmpty()) {
            String id = dq.poll();
            if (!visible.contains(id)) {
                continue;
            }
            MenuManageRow row = byId.get(id);
            if (row == null) {
                continue;
            }
            if ("PAGE".equalsIgnoreCase(nullSafe(row.getMenuType()))
                    && row.getMenuUrl() != null
                    && !row.getMenuUrl().isBlank()) {
                return true;
            }
            for (String c2 : childrenByParent.getOrDefault(id, Collections.emptyList())) {
                dq.add(c2);
            }
        }
        return false;
    }

    private BoSidebarMenuDto toDto(MenuManageRow r) {
        BoSidebarMenuDto d = new BoSidebarMenuDto();
        d.setMenuId(r.getMenuId());
        d.setParentMenuId(r.getParentMenuId());
        d.setMenuType(r.getMenuType());
        d.setMenuUrl(r.getMenuUrl());
        d.setIcon(r.getIcon());
        d.setMenuNmKo(r.getMenuNmKo());
        d.setMenuNmEn(r.getMenuNmEn());
        d.setMenuNmJa(r.getMenuNmJa());
        d.setMenuNmVi(r.getMenuNmVi());
        d.setDispSeq(r.getDispSeq());
        String tabId = r.getMenuId();
        String section = null;
        String raw = r.getMenuInfoRaw();
        if (raw != null && !raw.isBlank()) {
            try {
                JsonNode n = objectMapper.readTree(raw);
                if (n.hasNonNull("tab_id") && !n.get("tab_id").asText().isBlank()) {
                    tabId = n.get("tab_id").asText();
                }
                if (n.hasNonNull("sidebar_section")) {
                    section = n.get("sidebar_section").asText();
                }
            } catch (Exception e) {
                log.warn("Failed to parse menu_info_raw. menuId={}, tabId={}, section={}, raw={}",
                        r.getMenuId(), tabId, section, raw, e);
            }
        }
        d.setTabId(tabId);
        d.setSidebarSection(section);
        return d;
    }
}
