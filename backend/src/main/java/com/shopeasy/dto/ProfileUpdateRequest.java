package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 로그인 사용자 프로필 수정 요청. PUT /api/v1/profile.
 * 비밀번호를 비우면 변경하지 않음.
 */
@Getter
@Setter
public class ProfileUpdateRequest {

    /** 사용자 명 (표시명) */
    private String name;
    /** 새 비밀번호 (입력 시에만 변경) */
    private String newPassword;
    /** 새 비밀번호 확인 (오입력 방지) */
    private String newPasswordConfirm;
}
