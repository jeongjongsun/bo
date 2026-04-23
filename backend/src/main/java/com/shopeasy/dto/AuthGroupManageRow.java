package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/** 권한 관리 화면의 권한그룹 목록 행. */
@Getter
@Setter
public class AuthGroupManageRow {
    private String authGroupCd;
    private String authGroupNm;
    private Boolean isActive;
    private Integer userCount;
    private String remark;
    private String createdAt;
    private String createdBy;
    private String updatedAt;
    private String updatedBy;
}
