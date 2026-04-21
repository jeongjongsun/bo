package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/** 사용자 신규 등록. */
@Getter
@Setter
public class UserRegisterRequest {

    private String userId;
    private String userNm;
    private String password;
    private String emailId;
    private String gradeCd;
    private String authGroup;
    private String userStatus;
    private String mobileNo;
    private String corporationCd;
}
