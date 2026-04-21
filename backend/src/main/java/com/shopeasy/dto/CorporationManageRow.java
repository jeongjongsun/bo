package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 화주(법인) 관리 그리드 행 (OM_CORPORATION_M + corporation_info JSONB 일부).
 */
@Getter
@Setter
public class CorporationManageRow {

    private String corporationCd;
    private String corporationNm;
    private String businessNo;
    private String telNo;
    private String email;
    /** 표시용 (DB to_char 등). */
    private String createdAt;
}
