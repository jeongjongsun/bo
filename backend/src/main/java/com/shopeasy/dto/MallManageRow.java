package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 쇼핑몰(om_mall_m) 관리 그리드 행. mall_info·api_connection_info JSONB 일부를 컬럼으로 펼침.
 */
@Getter
@Setter
public class MallManageRow {

    private String mallCd;
    private String mallNm;
    private String mallUrl;
    private String salesTypeCd;
    /** API 연결 JSON 요약 표시용 (원문 JSON 텍스트). */
    private String apiConnectionInfoJson;
    private Boolean isActive;
    /** 표시용 (Asia/Seoul). */
    private String createdAt;
    private String updatedAt;
    private String createdBy;
    private String updatedBy;
}
