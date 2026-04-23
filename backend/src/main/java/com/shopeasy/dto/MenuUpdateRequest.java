package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/** 메뉴 수정 요청. */
@Getter
@Setter
public class MenuUpdateRequest {

    private String menuNmKo;
    private String menuNmEn;
    private String menuNmJa;
    private String menuNmVi;
    private String menuUrl;
    private Boolean isActive;
    private String icon;
    private Integer dispSeq;
    private String menuType;
}
