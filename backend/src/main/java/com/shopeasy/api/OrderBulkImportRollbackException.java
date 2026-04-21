package com.shopeasy.api;

import com.shopeasy.dto.OrderBulkImportResult;

/**
 * 주문 엑셀 일괄등록 중 한 건이라도 실패해 전체 롤백할 때, 클라이언트에 결과를 전달하기 위한 예외.
 */
public class OrderBulkImportRollbackException extends RuntimeException {
    private final OrderBulkImportResult result;

    public OrderBulkImportRollbackException(OrderBulkImportResult result, Throwable cause) {
        super(cause);
        this.result = result;
    }

    public OrderBulkImportResult getResult() {
        return result;
    }
}
