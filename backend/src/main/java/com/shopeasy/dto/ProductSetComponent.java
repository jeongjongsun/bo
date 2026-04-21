package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 상품 세트 구성품 1건 (OM_PRODUCT_SET_COMPONENT 테이블 또는 API 입출력).
 * product_type=SET 인 상품의 자식 상품 목록.
 */
@Getter
@Setter
public class ProductSetComponent {
    /** 구성품 상품 ID (OM_PRODUCT_M.product_id) */
    private String componentProductId;
    /** 구성품 수량 */
    private Integer componentQty;

}
