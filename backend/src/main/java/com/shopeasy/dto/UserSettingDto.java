package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 사용자 환경설정 조회/저장 DTO (om_user_setting_m).
 */
@Getter
@Setter
public class UserSettingDto {

    private String userId;
    private Boolean orderSimpleViewYn;
    private String defaultCorporationCd;
    /** 주문 그리드 기간 검색 기본값: ORDER_DT(주문일), REGIST_DT(등록일). null이면 주문일. */
    private String defaultOrderDateType;
    /** 주문 엑셀 일괄등록 시 상품 미매칭 주문: true=비매칭 주문으로 저장, false=저장 안 함 */
    private Boolean orderBulkSaveUnmatchedYn;

}
