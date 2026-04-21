package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 주문 상태별 카운트 (Mapper 결과 행).
 */
@Getter
@Setter
public class OrderCountByStatusRow {

    private String orderProcessStatus;
    private Long count;

}
