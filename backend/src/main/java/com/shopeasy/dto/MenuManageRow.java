package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 메뉴 관리 트리/상세용 플랫 행 (OM_MENU_M).
 */
@Getter
@Setter
public class MenuManageRow {

    private String menuId;
    private String parentMenuId;
    private String systemMainCd;
    private String systemSubCd;
    private String menuNmKo;
    private String menuNmEn;
    private String menuNmJa;
    private String menuNmVi;
    private String menuUrl;
    private Boolean isActive;
    private String icon;
    private Integer dispSeq;
    /** menu_info.menu_type */
    private String menuType;
    /** menu_info 전체 JSON 문자열 (수정 시 병합용) */
    private String menuInfoRaw;
}
