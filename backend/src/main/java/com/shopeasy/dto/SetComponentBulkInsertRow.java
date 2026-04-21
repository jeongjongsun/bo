package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 세트 구성품 bulk INSERT 1행. OM_PRODUCT_SET_COMPONENT 일괄 등록용.
 */
@Getter
@Setter
public class SetComponentBulkInsertRow {
    private String productId;
    private String componentProductId;
    private Integer componentQty;

}
