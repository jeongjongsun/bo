package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 주문 일괄등록 배치: om_order_m 1행 INSERT용.
 */
@Getter
@Setter
public class OrderMasterInsertRow {
    private long orderId;
    private String corporationCd;
    private String mallCd;
    private String storeCd;
    private String orderDt;
    private String registDt;
    private String orderNo;
    private String salesTypeCd;
    private String orderTypeCd;
    private String orderInfo;
    private String createdBy;
    private String updatedBy;

}
