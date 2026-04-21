package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 주문 마스터의 처리상태·처리자 조회용 (om_order_m 일부 컬럼).
 */
@Getter
@Setter
public class OrderProcessStatusRow {

    private Long orderId;
    private String registDt;
    private String orderProcessStatus;
    private String orderProcessStatusBy;
    private String orderProcessStatusDt;

}
