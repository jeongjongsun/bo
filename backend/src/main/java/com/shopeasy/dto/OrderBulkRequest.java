package com.shopeasy.dto;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

/**
 * 주문 일괄 처리 요청 (출고보류·보류해제 등). orderId + registDt 목록.
 * corporation_cd(필수), store_cd(선택) 로 소속 검증.
 */
@Getter
@Setter
public class OrderBulkRequest {

    private String corporationCd;
    private String storeCd;
    private List<OrderKey> items;

public static class OrderKey {
        private Long orderId;
        private String registDt;

        public Long getOrderId() {
            return orderId;
        }

        public void setOrderId(Long orderId) {
            this.orderId = orderId;
        }

        public String getRegistDt() {
            return registDt;
        }

        public void setRegistDt(String registDt) {
            this.registDt = registDt;
        }
    }

    /** 주문서 처리 일괄 업데이트용: orderId + registDt + 부여할 합포장번호. */
    public static class OrderKeyWithShipNo {
        private Long orderId;
        private String registDt;
        private String combinedShipNo;

        public Long getOrderId() { return orderId; }
        public void setOrderId(Long orderId) { this.orderId = orderId; }
        public String getRegistDt() { return registDt; }
        public void setRegistDt(String registDt) { this.registDt = registDt; }
        public String getCombinedShipNo() { return combinedShipNo; }
        public void setCombinedShipNo(String combinedShipNo) { this.combinedShipNo = combinedShipNo; }
    }
}
