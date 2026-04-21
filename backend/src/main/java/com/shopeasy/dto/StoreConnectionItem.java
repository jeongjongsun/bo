package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 상점 API 접속정보 1건 (om_store_connection_m).
 */
@Getter
@Setter
public class StoreConnectionItem {

    private Long connectionId;
    private Long storeId;
    private String connectionAlias;
    private String apiId;
    private String apiPassword;
    private String clientId;
    private String siteCode;
    private String redirectUri;
    private String clientSecret;
    private String scope;
    private String createdAt;
    private String updatedAt;
    private String createdBy;
    private String updatedBy;

}
