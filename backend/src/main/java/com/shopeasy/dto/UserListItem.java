package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 사용자 목록 조회용 DTO. password 제외, user_info JSONB 필드 포함.
 */
@Getter
@Setter
public class UserListItem {

    private String userId;
    private String userNm;
    private String corporationCd;
    private String gradeCd;
    private String userType;
    private String userStatus;
    private String authGroup;
    private String mobileNo;
    private String emailId;
    private String privacyAccess;
    private String secondAuthYn;
    private String accessIpLimit;
    private String accessIp;
    private Integer passwordFailCnt;
    private String lastLoginDtm;
    /** 등록일시 (표시용 문자열). */
    private String createdAt;

}
