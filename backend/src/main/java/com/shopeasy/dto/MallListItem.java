package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 쇼핑몰 목록 조회용 DTO (om_mall_m). mall_info JSONB 항목 일부 포함.
 */
@Getter
@Setter
public class MallListItem {

    private Long mallId;
    private String mallCd;
    private String mallNm;
    private String mallUrl;
    private String apiUrl;
    private String deliveryType;
    private String collectionType;
    private String salesTypeCd;
    private Boolean isActive;
    private String createdAt;
    private String updatedAt;
    private String createdBy;
    private String updatedBy;

}
