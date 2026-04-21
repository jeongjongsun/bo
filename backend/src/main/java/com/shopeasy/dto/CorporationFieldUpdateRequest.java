package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 화주 목록 그리드 셀 단건 수정 (PUT /api/v1/corporations/field).
 * <p>field: corporationNm, businessNo, telNo, email</p>
 */
@Getter
@Setter
public class CorporationFieldUpdateRequest {

    private String corporationCd;
    private String field;
    private Object value;
}
