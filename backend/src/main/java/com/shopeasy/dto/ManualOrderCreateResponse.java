package com.shopeasy.dto;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

/**
 * 수기 주문 등록 응답. 생성된 orderId, registDt, orderNo, 라인별 itemOrderNo 반환.
 */
@Getter
@Setter
public class ManualOrderCreateResponse {

    private Long orderId;
    private String registDt;
    private String orderNo;
    private List<LineResult> items;

    public static class LineResult {
        private Integer lineNo;
        private String itemOrderNo;

        public LineResult() {}
        public LineResult(Integer lineNo, String itemOrderNo) {
            this.lineNo = lineNo;
            this.itemOrderNo = itemOrderNo;
        }
        public Integer getLineNo() { return lineNo; }
        public void setLineNo(Integer lineNo) { this.lineNo = lineNo; }
        public String getItemOrderNo() { return itemOrderNo; }
        public void setItemOrderNo(String itemOrderNo) { this.itemOrderNo = itemOrderNo; }
    }

}
