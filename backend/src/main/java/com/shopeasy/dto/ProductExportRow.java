package com.shopeasy.dto;

import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

/**
 * OM_PRODUCT_M 전체 컬럼 + product_info 스칼라 + base_unit_cd.
 * 엑셀 전체 다운로드용.
 */
@Getter
@Setter
public class ProductExportRow {
    private String productId;
    private String corporationCd;
    private String productCd;
    private String productNm;
    private String productType;
    private BigDecimal salePrice;
    private Integer stockQty;
    private Boolean isGift;
    private Boolean isSale;
    private Boolean isDisplay;
    private String baseUnitCd;
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
    private String createdAt;
    private String updatedAt;
    private String createdBy;
    private String updatedBy;

}
