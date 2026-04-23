package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/** 권한그룹 메뉴 변경 감사 로그 조회 행. */
@Getter
@Setter
public class AuthGroupMenuAuditRow {
    private Long id;
    private String actionType;
    private String systemMainCd;
    private String systemSubCd;
    private String beforeMenuIds;
    private String afterMenuIds;
    private Integer affectedUserCount;
    private String changeReason;
    private String requestId;
    private String requestIp;
    private String userAgent;
    private String createdAt;
    private String createdBy;
}
