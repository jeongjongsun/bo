package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 주문 마스터 상세 (om_order_m). 조회·수정용.
 * 수령인/주문자/메모 등은 order_info JSONB에 저장되며, API에서는 flat 필드로 주고받음.
 */
@Getter
@Setter
public class OrderMasterDetail {

    private Long orderId;
    private String registDt;
    private String corporationCd;
    private String mallCd;
    private String storeCd;
    private String orderDt;
    private String orderNo;
    private String combinedShipNo;
    private String salesTypeCd;
    private String orderProcessStatus;
    private String orderTypeCd;
    private String receiverNm;
    private String receiverTel;
    private String receiverMobile;
    private String receiverAddr;
    private String receiverAddr2;
    private String receiverZip;
    private String ordererNm;
    private String ordererUserId;
    private String ordererTel;
    private String ordererMobile;
    private String memo;
    /** 배송비 (order_info.deliveryFee) */
    private java.math.BigDecimal deliveryFee;
    /** 결제방법 코드 (order_info.paymentMethodCd) */
    private String paymentMethodCd;
    /** order_info JSONB 나머지 확장 데이터. API에서는 문자열로 주고받음. */
    private String orderInfo;
    private String createdAt;
    private String updatedAt;
    private String createdBy;
    private String updatedBy;

}
