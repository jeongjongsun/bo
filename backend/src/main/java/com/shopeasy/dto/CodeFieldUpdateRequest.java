package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/** 그리드 셀 편집 공통코드 필드 갱신. */
@Getter
@Setter
public class CodeFieldUpdateRequest {

    private String mainCd;
    private String subCd;
    /** codeNmKo | codeNmEn | useYn | dispSeq | etc1 | etc2 */
    private String field;
    private Object value;
}
