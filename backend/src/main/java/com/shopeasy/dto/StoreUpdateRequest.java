package com.shopeasy.dto;

import java.util.Map;
import lombok.Getter;
import lombok.Setter;

/** 상점 수정 요청 (om_mall_store_m). mall_cd, store_nm, store_info, is_active. */
@Getter
@Setter
public class StoreUpdateRequest {

    private String mallCd;
    private String storeNm;
    private Map<String, Object> storeInfo;
    private Boolean isActive;

}
