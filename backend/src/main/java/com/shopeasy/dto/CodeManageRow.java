package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 공통코드 관리 그리드 행 (OM_CODE_M).
 * rowType MAIN: main_cd=CODE, sub_cd=대분류(그룹) 코드.
 * rowType DETAIL: main_cd=그룹 코드, sub_cd=하위 코드.
 */
@Getter
@Setter
public class CodeManageRow {

    /** MAIN | DETAIL */
    private String rowType;
    private String mainCd;
    private String subCd;
    private String codeNmKo;
    private String codeNmEn;
    private String useYn;
    private Integer dispSeq;
    private String etc1;
    private String etc2;
    private String createdAt;
}
