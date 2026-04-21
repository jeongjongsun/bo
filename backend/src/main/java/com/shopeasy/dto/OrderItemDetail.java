package com.shopeasy.dto;

import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

/**
 * 주문 라인 상세 (om_order_item_m). 조회·수정용.
 * line_payload는 JSONB → 문자열로 주고받음.
 */
@Getter
@Setter
public class OrderItemDetail {

    private Long orderId;
    private String registDt;
    private Integer lineNo;
    private String itemOrderNo;
    private String productCd;
    private String productNm;
    private Integer lineQty;
    private BigDecimal lineAmount;
    private BigDecimal lineDiscountAmount;
    /** JSONB. API에서는 문자열로 주고받음. */
    private String linePayload;
    private String createdAt;
    private String updatedAt;
    private String createdBy;
    private String updatedBy;

}
