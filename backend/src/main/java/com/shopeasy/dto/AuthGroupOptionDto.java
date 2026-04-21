package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/** 권한 그룹 select 옵션 (GET /api/v1/auth-groups). */
@Getter
@Setter
public class AuthGroupOptionDto {
    private String authGroupCd;
    private String authGroupNm;
}
