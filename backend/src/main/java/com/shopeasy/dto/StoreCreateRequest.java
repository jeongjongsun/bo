package com.shopeasy.dto;

import java.util.Map;
import lombok.Getter;
import lombok.Setter;

/** 상점 등록 요청 (om_mall_store_m). */
@Getter
@Setter
public class StoreCreateRequest {

    private String mallCd;
    private String corporationCd;
    private String storeCd;
    private String storeNm;
    private Map<String, Object> storeInfo;
    private Boolean isActive;

}
