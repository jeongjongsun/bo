package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 화주(법인) 상세 수정 (PUT /api/v1/corporations/detail).
 */
@Getter
@Setter
public class CorporationDetailUpdateRequest {

    private String corporationCd;
    private String corporationNm;
    private String businessNo;
    private String telNo;
    private String email;
    private String ceoNm;
    private String address;
    private String faxNo;
    private String homepageUrl;
    private String remark;
}
