package com.shopeasy.dto;

import java.math.BigDecimal;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

/**
 * 상품 등록 요청 DTO (POST /api/v1/products).
 * 수정 요청과 동일 필드 + corporationCd 필수.
 */
@Getter
@Setter
public class ProductCreateRequest {

    private String corporationCd;
    private String productCd;
    private String productNm;
    private String productType;
    private String baseUnitCd;
    private Boolean isSale;
    private Boolean isDisplay;

    private String productEnNm;
    private String categoryCd;
    private String brandCd;
    private BigDecimal costPrice;
    private BigDecimal supplyPrice;
    private String taxType;
    private Integer safetyStockQty;
    private Integer minOrderQty;
    private Integer maxOrderQty;
    private Integer sortOrder;
    private String description;
    private String imageUrl;
    private String remark;
    private List<ProductUnit> units;
    private List<ProductSetComponent> setComponents;

}
