package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/** 메뉴 등록 요청. menu_id는 서버 자동 채번. */
@Getter
@Setter
public class MenuCreateRequest {

    /** 기본 SYSTEM */
    private String systemMainCd;
    /** OM | BO (om_code_m SYSTEM 하위 sub_cd) */
    private String systemSubCd;
    private String parentMenuId;
    private String menuNmKo;
    private String menuNmEn;
    private String menuNmJa;
    private String menuNmVi;
    private String menuUrl;
    private Boolean isActive;
    private String icon;
    private Integer dispSeq;
    /** 생략 시 URL 유무로 GROUP | PAGE 추론 */
    private String menuType;
}
