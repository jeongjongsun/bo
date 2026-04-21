package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 단위/바코드 bulk INSERT 1행. OM_PRODUCT_UNIT 일괄 등록용.
 */
@Getter
@Setter
public class UnitBulkInsertRow {
    private String productId;
    private String unitCd;
    private String barcode;
    private Integer packQty;
    private Boolean isBaseUnit;

}
