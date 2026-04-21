package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 법인(화주사) 목록 조회용 DTO (OM_CORPORATION_M).
 */
@Getter
@Setter
public class CorporationItem {

    private String corporationCd;
    private String corporationNm;

}
