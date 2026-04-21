package com.shopeasy.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

/**
 * 수기 주문 등록 요청. order_info.registrationType = MANUAL 저장.
 */
@Getter
@Setter
public class ManualOrderCreateRequest {

    @NotBlank(message = "corporationCd required")
    private String corporationCd;
    @NotBlank(message = "mallCd required")
    private String mallCd;
    @NotBlank(message = "storeCd required")
    private String storeCd;
    /** 엑셀 일괄등록 시 사용. 수기 등록 시 null이면 M-YYYYMMDD-NNNN 자동 채번 */
    private String orderNo;
    private String salesTypeCd;
    private String orderDt;
    private String registDt;
    private String receiverNm;
    private String receiverTel;
    private String receiverMobile;
    private String receiverAddr;
    private String receiverAddr2;
    private String receiverZip;
    private String ordererNm;
    private String ordererTel;
    private String ordererMobile;
    private String memo;
    /** 배송비 (order_info.deliveryFee) */
    private java.math.BigDecimal deliveryFee;
    /** 결제방법 코드 (order_info.paymentMethodCd, 공통코드 PAYMENT_METHOD) */
    private String paymentMethodCd;

    @NotEmpty(message = "items required")
    @Valid
    private List<LineItem> items;

    public static class LineItem {
        /** 상품 PK (OM_PRODUCT_M.product_id, 문자열) */
        private String productId;
        private String productCd;
        private String productNm;
        @NotNull
        private Integer lineQty = 1;
        @NotNull
        private BigDecimal lineAmount = BigDecimal.ZERO;
        private BigDecimal lineDiscountAmount = BigDecimal.ZERO;

        public String getProductId() { return productId; }
        public void setProductId(String productId) { this.productId = productId; }
        public String getProductCd() { return productCd; }
        public void setProductCd(String productCd) { this.productCd = productCd; }
        public String getProductNm() { return productNm; }
        public void setProductNm(String productNm) { this.productNm = productNm; }
        public Integer getLineQty() { return lineQty; }
        public void setLineQty(Integer lineQty) { this.lineQty = lineQty; }
        public BigDecimal getLineAmount() { return lineAmount; }
        public void setLineAmount(BigDecimal lineAmount) { this.lineAmount = lineAmount; }
        public BigDecimal getLineDiscountAmount() { return lineDiscountAmount; }
        public void setLineDiscountAmount(BigDecimal lineDiscountAmount) { this.lineDiscountAmount = lineDiscountAmount; }
    }

}
