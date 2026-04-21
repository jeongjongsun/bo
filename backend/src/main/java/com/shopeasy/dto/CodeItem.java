package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 공통코드 1건 (CM_CODE_M 조회 결과). sub_cd + 현재 언어의 code_nm.
 */
@Getter
@Setter
public class CodeItem {
    private String subCd;
    private String codeNm;

}
