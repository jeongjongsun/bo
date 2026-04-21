package com.shopeasy.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * POST /api/v1/auth/login 요청 body.
 */
@Getter
@Setter
public class LoginRequest {

    /** 사용자 아이디 (OM_USER_M.user_id) */
    @NotBlank(message = "사용자 아이디를 입력하세요.")
    private String userId;

    /** 평문 비밀번호 (서버에서 bcrypt 비교) */
    @NotBlank(message = "비밀번호를 입력하세요.")
    private String password;

}
