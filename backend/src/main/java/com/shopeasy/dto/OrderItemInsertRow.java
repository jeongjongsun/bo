package com.shopeasy.dto;

import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

/**
 * 주문 일괄등록 배치: om_order_item_m 1행 INSERT용.
 */
@Getter
@Setter
public class OrderItemInsertRow {
    private long orderId;
    private String registDt;
    private int lineNo;
    private String itemOrderNo;
    private String productCd;
    private String productNm;
    private int lineQty;
    private BigDecimal lineAmount;
    private BigDecimal lineDiscountAmount;
    private String linePayload;
    private String createdBy;
    private String updatedBy;

}
