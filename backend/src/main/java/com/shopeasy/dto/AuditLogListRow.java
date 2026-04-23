package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AuditLogListRow {
    private Long id;
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
    private String actedAt;
}
