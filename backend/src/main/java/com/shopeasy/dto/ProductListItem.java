package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 상품 목록 1건 (GET /api/v1/products 응답 항목).
 */
@Getter
@Setter
public class ProductListItem {

    private long rowNum;
    private String productId;
    private String productCd;
    private String productNm;
    private String productType;
    /** 기본단위 코드 (OM_PRODUCT_UNIT.is_base_unit=true 인 unit_cd) */
    private String baseUnitCd;
    private boolean isSale;
    private boolean isDisplay;
    private String createdBy;
    private String createdAt;

}
