package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 대분류(그룹) 아래 하위 코드 등록. DB에는 main_cd=parentMainCd, sub_cd=신규 코드로 INSERT.
 */
@Getter
@Setter
public class CodeManageChildRegisterRequest {

    /** CODE 행의 sub_cd와 동일한 그룹 코드 (예: ORDER_TYPE). */
    private String parentMainCd;
    private String subCd;
    private String codeNmKo;
    private String codeNmEn;
    private String useYn;
    private Integer dispSeq;
}
