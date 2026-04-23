package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/** 권한그룹별 메뉴 권한 저장 요청. */
@Getter
@Setter
public class AuthGroupMenuSaveRequest {
    private String systemMainCd;
    private String systemSubCd;
    private List<String> menuIds;
    private String changeReason;
}
