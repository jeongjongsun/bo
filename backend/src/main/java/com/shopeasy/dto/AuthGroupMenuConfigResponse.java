package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/** 권한그룹 메뉴 권한 모달 조회 응답. */
@Getter
@Setter
public class AuthGroupMenuConfigResponse {
    private String authGroupCd;
    private String systemMainCd;
    private String systemSubCd;
    private List<MenuManageRow> menus;
    private List<String> selectedMenuIds;
}
