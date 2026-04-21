package com.shopeasy.dto;

import java.util.Map;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

/**
 * 주문 상태별 카운트 API 응답. 툴바 탭에 전체·상태별 건수 표시용.
 */
@Getter
@Setter
@NoArgsConstructor
public class OrderCountsByStatusResponse {

    /** 전체 건수 (라인 단위, is_deleted=false) */
    private long total;
    /** 상태코드별 건수 (ORDER_RECEIVED, PROCESSING, ...) */
    private Map<String, Long> counts;
    /** 삭제 주문 건수 (is_deleted=true, 라인 단위) */
    private long deletedCount;

public OrderCountsByStatusResponse(long total, Map<String, Long> counts) {
        this.total = total;
        this.counts = counts;
    }

public void setCounts(Map<String, Long> counts) {
        this.counts = counts;
    }
}
