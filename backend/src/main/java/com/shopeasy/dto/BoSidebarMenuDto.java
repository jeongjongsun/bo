package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/** BO 사이드바용 메뉴 노드(플랫, 프론트에서 parent 기준 트리 구성). */
@Getter
@Setter
public class BoSidebarMenuDto {

    private String menuId;
    private String parentMenuId;
    /** menu_info.menu_type — GROUP | PAGE */
    private String menuType;
    /** 탭 id: menu_info.tab_id 없으면 menu_id */
    private String tabId;
    private String menuUrl;
    private String icon;
    /** menu_info.sidebar_section (GROUP·일부 PAGE) */
    private String sidebarSection;
    private String menuNmKo;
    private String menuNmEn;
    private String menuNmJa;
    private String menuNmVi;
    private Integer dispSeq;
}
