package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 주문 목록 그리드용 DTO (om_order_m 라인 단위, mall/store 명칭 조인).
 */
@Getter
@Setter
public class OrderListItem {

    private Long orderId;
    private Integer lineNo;
    private String orderNo;
    private String itemOrderNo;
    private String combinedShipNo;
    private String mallCd;
    private String mallNm;
    private String storeCd;
    private String storeNm;
    private String orderDt;
    private String registDt;
    private String orderProcessStatus;
    private String salesTypeCd;
    private String orderTypeCd;
    private String productCd;
    private String productNm;
    private Integer lineQty;
    private java.math.BigDecimal lineAmount;
    private java.math.BigDecimal lineDiscountAmount;
    /** 라인별 확장(옵션·사은품 등). JSONB → 문자열 */
    private String linePayload;
    private String receiverNm;
    private String receiverTel;
    private String receiverMobile;
    private String receiverAddr;
    private String receiverAddr2;
    private String receiverZip;
    private String createdAt;
    private String createdBy;

}
