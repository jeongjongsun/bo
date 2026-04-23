package com.shopeasy.mapper;

import com.shopeasy.dto.AuditLogListRow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface OmAuditLogHMapper {

    int insertAudit(
            @Param("domainType") String domainType,
            @Param("systemMainCd") String systemMainCd,
            @Param("systemSubCd") String systemSubCd,
            @Param("menuCode") String menuCode,
            @Param("menuNameKo") String menuNameKo,
            @Param("actionCode") String actionCode,
            @Param("actionNameKo") String actionNameKo,
            @Param("entityType") String entityType,
            @Param("entityId") String entityId,
            @Param("beforeData") String beforeData,
            @Param("afterData") String afterData,
            @Param("changedFields") String changedFields,
            @Param("actorUserId") String actorUserId,
            @Param("requestId") String requestId,
            @Param("requestIp") String requestIp,
            @Param("userAgent") String userAgent,
            @Param("createdBy") String createdBy);

    long selectAuditLogCount(
            @Param("systemSubCd") String systemSubCd,
            @Param("actionCode") String actionCode,
            @Param("keyword") String keyword,
            @Param("fromTs") String fromTs,
            @Param("toTs") String toTs);

    List<AuditLogListRow> selectAuditLogList(
            @Param("systemSubCd") String systemSubCd,
            @Param("actionCode") String actionCode,
            @Param("keyword") String keyword,
            @Param("fromTs") String fromTs,
            @Param("toTs") String toTs,
            @Param("limit") int limit,
            @Param("offset") int offset);
}
