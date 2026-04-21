package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 엑셀 "Units" 시트 1행. (corporation_cd, product_cd)로 상품 연결 후 product_id로 변환.
 */
@Getter
@Setter
public class UnitExcelRow {
    private String corporationCd;
    private String productCd;
    private String unitCd;
    private String barcode;
    private Integer packQty;
    private Boolean isBaseUnit;

}
