package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/** 서비스 계층 공통 감사 이력 저장 명령 객체. */
@Getter
@Setter
public class AuditLogCommand {
    private String domainType;
    private String systemMainCd;
    private String systemSubCd;
    private String menuCode;
    private String menuNameKo;
    private String actionCode;
    private String actionNameKo;
    private String entityType;
    private String entityId;
    private String beforeData;
    private String afterData;
    private String changedFields;
    private String actorUserId;
    private String requestId;
    private String requestIp;
    private String userAgent;
}
