package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 화주(법인) 상세 조회·수정 모달용 응답.
 */
@Getter
@Setter
public class CorporationDetailResponse {

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
    private Boolean isActive;
    private String createdAt;
    private String updatedAt;
    private String createdBy;
    private String updatedBy;
}
