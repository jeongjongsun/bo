package com.shopeasy.mapper;

import com.shopeasy.dto.AuthGroupMenuAuditRow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/** OM_AUTH_GROUP_MENU_AUDIT_H 권한 변경 감사 로그. */
@Mapper
public interface OmAuthGroupMenuAuditHMapper {

    int insertAudit(
            @Param("authGroupCd") String authGroupCd,
            @Param("actionType") String actionType,
            @Param("systemMainCd") String systemMainCd,
            @Param("systemSubCd") String systemSubCd,
            @Param("beforeMenuIds") String beforeMenuIds,
            @Param("afterMenuIds") String afterMenuIds,
            @Param("affectedUserCount") int affectedUserCount,
            @Param("changeReason") String changeReason,
            @Param("requestId") String requestId,
            @Param("requestIp") String requestIp,
            @Param("userAgent") String userAgent,
            @Param("createdBy") String createdBy);

    long selectAuditCount(@Param("authGroupCd") String authGroupCd);

    List<AuthGroupMenuAuditRow> selectAuditList(
            @Param("authGroupCd") String authGroupCd,
            @Param("limit") int limit,
            @Param("offset") int offset);
}
