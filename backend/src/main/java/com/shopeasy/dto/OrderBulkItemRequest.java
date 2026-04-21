package com.shopeasy.dto;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

/**
 * 주문 라인(아이템) 일괄 삭제 요청. orderId + registDt + lineNo 목록.
 * corporation_cd(필수), store_cd(선택) 로 소속 검증.
 */
@Getter
@Setter
public class OrderBulkItemRequest {

    private String corporationCd;
    private String storeCd;
    private List<ItemKey> items;

public static class ItemKey {
        private Long orderId;
        private String registDt;
        private Integer lineNo;

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

        public Integer getLineNo() {
            return lineNo;
        }

        public void setLineNo(Integer lineNo) {
            this.lineNo = lineNo;
        }
    }
}
