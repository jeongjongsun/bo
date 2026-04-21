package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

/**
 * 로그인 사용자 프로필 조회 응답. GET /api/v1/profile.
 */
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ProfileResponse {

    private String userId;
    private String name;
    private String emailId;
    private String mobileNo;

}
