package com.shopeasy.dto;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

/**
 * 주문서 처리 일괄 API 응답. 처리 건수와 동시 처리로 제외된 건(누가 처리했는지) 정보.
 */
@Getter
@Setter
public class OrderBulkProcessResult {

    private int processedCount;
    /** 실제 처리된 주문의 라인 수 (표시용) */
    private int processedLineCount;
    private int skippedCount;
    private List<OrderSkippedItem> skipped;

/** 제외된 건 1건: 다른 사용자가 이미 처리한 경우 처리자·처리시각. 표시용으로 처리자 이름(processedByNm) 사용. */
    public static class OrderSkippedItem {
        private String processedBy;
        private String processedByNm;
        private String processedAt;

        public String getProcessedBy() {
            return processedBy;
        }

        public void setProcessedBy(String processedBy) {
            this.processedBy = processedBy;
        }

        /** 처리자 표시명 (사용자 이름). 없으면 processedBy(userId) 사용. */
        public String getProcessedByNm() {
            return processedByNm;
        }

        public void setProcessedByNm(String processedByNm) {
            this.processedByNm = processedByNm;
        }

        public String getProcessedAt() {
            return processedAt;
        }

        public void setProcessedAt(String processedAt) {
            this.processedAt = processedAt;
        }
    }
}
