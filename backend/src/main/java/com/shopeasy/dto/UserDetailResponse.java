package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/** 사용자 상세(모달). 비밀번호 해시 미포함. */
@Getter
@Setter
public class UserDetailResponse {

    private String userId;
    private String userNm;
    private String emailId;
    private String gradeCd;
    private String authGroup;
    private String userStatus;
    private String mobileNo;
    private String corporationCd;
    private String createdAt;
    private String updatedAt;
    private String createdBy;
    private String updatedBy;
}
