package com.shopeasy.dto;

import java.util.List;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

/**
 * 상품 엑셀 bulk 업로드 결과.
 */
@Getter
@Setter
@NoArgsConstructor
public class BulkImportResult {
    /** 등록 성공 건수 (실제 INSERT된 상품 수) */
    private int successCount;
    /** 중복으로 스킵된 건수 (이미 등록된 상품코드) */
    private int skippedCount;
    /** 스킵된 상품코드 목록 (중복 시) */
    private List<String> skippedProductCodes;
    /** 오류 메시지 (실패 시 다국어 키 또는 메시지) */
    private String errorMessage;

public BulkImportResult(int successCount) {
        this.successCount = successCount;
        this.skippedCount = 0;
    }
    public BulkImportResult(int successCount, int skippedCount, List<String> skippedProductCodes) {
        this.successCount = successCount;
        this.skippedCount = skippedCount;
        this.skippedProductCodes = skippedProductCodes;
    }
}
