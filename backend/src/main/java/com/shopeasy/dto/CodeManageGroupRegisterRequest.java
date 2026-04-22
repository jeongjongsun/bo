package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/** 대분류 코드 등록 (main_cd=CODE 행 추가). */
@Getter
@Setter
public class CodeManageGroupRegisterRequest {

    private String subCd;
    private String codeNmKo;
    private String codeNmEn;
    private String useYn;
    private Integer dispSeq;
}
