package com.shopeasy.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/** 등록 응답에 부여된 메뉴 코드. */
@Getter
@AllArgsConstructor
public class MenuCreateResult {
    private final String menuId;
}
