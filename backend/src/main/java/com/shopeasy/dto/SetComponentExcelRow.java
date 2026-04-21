package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 엑셀 "SetComponents" 시트 1행. parent/component를 (corporation_cd, product_cd)로 지정, 서비스에서 product_id로 변환.
 */
@Getter
@Setter
public class SetComponentExcelRow {
    private String parentCorporationCd;
    private String parentProductCd;
    private String componentCorporationCd;
    private String componentProductCd;
    private Integer componentQty;

}
