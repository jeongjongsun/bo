package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/** OM_CODE_M 단건 JSON 텍스트 조회 (갱신 시 병합용). */
@Getter
@Setter
public class CodeRowRaw {

    private String mainCd;
    private String subCd;
    private String codeNm;
    private String codeInfo;
    private String createdAt;
}
