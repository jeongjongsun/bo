package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 주문 일괄 처리(보류/보류해제/단계이동 등) 결과: 실제 처리된 주문 건수·라인 수.
 */
@Getter
@Setter
public class OrderBulkCountResult {

    private int orderCount;
    private int lineCount;

}
