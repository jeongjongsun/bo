package com.shopeasy.dto;

import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

/**
 * 주문 엑셀 일괄등록 결과.
 */
@Getter
@Setter
@NoArgsConstructor
public class OrderBulkImportResult {

    /** 등록 성공한 주문 건수 */
    private int successOrderCount;
    /** 등록 실패한 주문 건수 */
    private int failOrderCount;
    /** 등록 성공한 라인(상품) 건수 */
    private int successLineCount;
    /** 실패 시 상세 메시지 (주문그룹 또는 메시지) */
    private List<String> errors = new ArrayList<>();

public void setErrors(List<String> errors) { this.errors = errors != null ? errors : new ArrayList<>(); }
}
