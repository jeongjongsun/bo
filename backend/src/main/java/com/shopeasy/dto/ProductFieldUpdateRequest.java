package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 상품 필드 단건 수정 요청 (PUT /api/v1/products/field).
 * <p>field: productCd, productNm, productType, baseUnitCd, isSale, isDisplay 중 하나.</p>
 */
@Getter
@Setter
public class ProductFieldUpdateRequest {

    private String productId;
    /** 수정할 필드명 (EDITABLE_FIELDS) */
    private String field;
    /** 새 값 (타입은 필드에 맞게) */
    private Object value;

}
