package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/** 권한그룹 기본 정보 수정 요청. */
@Getter
@Setter
public class AuthGroupUpdateRequest {
    private String authGroupNm;
    private String remark;
}
