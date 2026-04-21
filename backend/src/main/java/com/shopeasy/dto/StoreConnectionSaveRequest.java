package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/** 상점 API 접속정보 등록/수정 요청 (om_store_connection_m). */
@Getter
@Setter
public class StoreConnectionSaveRequest {

    private String connectionAlias;
    private String apiId;
    private String apiPassword;
    private String clientId;
    private String siteCode;
    private String redirectUri;
    private String clientSecret;
    private String scope;

}
