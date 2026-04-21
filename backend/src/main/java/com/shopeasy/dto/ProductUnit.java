package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 상품 단위/바코드 1건 (OM_PRODUCT_UNIT 테이블 또는 API 입출력).
 */
@Getter
@Setter
public class ProductUnit {
    /** 단위코드 (EA, CS, PLT 등) */
    private String unitCd;
    /** 바코드 (nullable) */
    private String barcode;
    /** 입수량 (기본단위 환산 수량, 기본 1) */
    private Integer packQty;
    /** 기본단위 여부 (상품당 1건만 true) */
    private boolean isBaseUnit;

}
