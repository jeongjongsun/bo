package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 상품 bulk INSERT 1행. OM_PRODUCT_M 일괄 등록용.
 * product_info는 JSON 문자열로 전달(매퍼에서 ::jsonb 캐스팅).
 */
@Getter
@Setter
public class ProductBulkInsertRow {
    private String productId;
    private String corporationCd;
    private String productCd;
    private String productNm;
    private String productType;
    private Boolean isSale;
    private Boolean isDisplay;
    /** product_info JSONB 값. JSON 문자열 (예: {"product_en_nm":"x"}). 빈 객체면 "{}" */
    private String productInfoJson;
    private String createdBy;

}
