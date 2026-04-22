package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/** 모달에서 공통코드 1건 수정. */
@Getter
@Setter
public class CodeManageDetailUpdateRequest {

    private String mainCd;
    private String subCd;
    private String codeNmKo;
    private String codeNmEn;
    private String useYn;
    private Integer dispSeq;
    private String etc1;
    private String etc2;
}
