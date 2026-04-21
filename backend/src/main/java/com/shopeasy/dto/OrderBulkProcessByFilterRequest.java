package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 일괄 주문서 처리(필터 조건) 요청. 발주(접수) 탭의 현재 필터와 동일한 조건으로 전체 처리.
 */
@Getter
@Setter
public class OrderBulkProcessByFilterRequest {

    private String corporationCd;
    private Long storeId;
    private String salesTypeCd;
    private String dateType;
    private String orderDtFrom;
    private String orderDtTo;
    private String searchColumn;
    private String searchKeyword;

}
