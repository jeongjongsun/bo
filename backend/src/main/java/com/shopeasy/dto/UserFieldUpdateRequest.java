package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 사용자 목록 그리드 셀 단건 수정 (PUT /api/v1/users/field).
 * <p>field: userNm, emailId, gradeCd, authGroup, userStatus</p>
 */
@Getter
@Setter
public class UserFieldUpdateRequest {

    private String userId;
    private String field;
    private Object value;
}
