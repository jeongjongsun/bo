package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 화주(법인) 신규 등록 요청. 화주코드는 서버에서 {@code CORP-####} 로 자동 채번.
 */
@Getter
@Setter
public class CorporationCreateRequest {

    private String corporationNm;
    private String businessNo;
    private String telNo;
    private String email;
    private String ceoNm;
    private String address;
    private String faxNo;
    private String homepageUrl;
    private String remark;
}
