package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 쇼핑몰+상점 목록 조회용 DTO (om_mall_m JOIN om_mall_store_m, 상점 단위 한 행).
 */
@Getter
@Setter
public class MallStoreListItem {

    private Long storeId;
    private String mallCd;
    private String mallNm;
    private String storeCd;
    private String storeNm;
    private String deliveryType;
    private String collectionType;
    private String salesTypeCd;
    private Boolean isActive;
    /** JSON 문자열 (store_info JSONB). */
    private String storeInfo;
    private String createdAt;
    private String createdBy;

}
