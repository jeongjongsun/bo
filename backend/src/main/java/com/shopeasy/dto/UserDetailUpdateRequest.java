package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/** 사용자 모달 일괄 수정. newPassword 가 비어 있으면 비밀번호 유지. */
@Getter
@Setter
public class UserDetailUpdateRequest {

    private String userId;
    private String userNm;
    private String emailId;
    private String gradeCd;
    private String authGroup;
    private String userStatus;
    private String mobileNo;
    private String corporationCd;
    /** 변경 시에만 평문 전달. 빈 문자열·null 이면 기존 비밀번호 유지. */
    private String newPassword;
}
